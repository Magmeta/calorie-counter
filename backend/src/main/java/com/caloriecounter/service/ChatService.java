package com.caloriecounter.service;

import com.caloriecounter.dto.ChatRequest;
import com.caloriecounter.dto.ChatResponse;
import com.caloriecounter.dto.MessageResponse;
import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.Message;
import com.caloriecounter.entity.Message.ChatMode;
import com.caloriecounter.entity.Message.Role;
import com.caloriecounter.entity.User;
import com.caloriecounter.entity.UserProfile;
import com.caloriecounter.entity.UserHabit;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.MessageRepository;
import com.caloriecounter.repository.UserProfileRepository;
import com.caloriecounter.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final AiService aiService;
    private final FoodDatabaseService foodDatabaseService;
    private final MealEntryRepository mealEntryRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserHabitService userHabitService;
    private final ObjectMapper objectMapper;

    public ChatResponse sendMessage(String username, ChatRequest request) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        ChatMode chatMode = ChatMode.valueOf(request.getChatMode());

        // Сохраняем сообщение пользователя
        Message userMessage = new Message();
        userMessage.setUser(user);
        userMessage.setRole(Role.USER);
        userMessage.setContent(request.getMessage());
        userMessage.setChatMode(chatMode);
        messageRepository.save(userMessage);

        // В режиме дневника ищем продукты в USDA для точности
        String foodData = null;
        if (chatMode == ChatMode.DIARY) {
            foodData = foodDatabaseService.searchFood(request.getMessage());
            if (foodData != null) {
                log.info("Найдены данные USDA для: {}", request.getMessage());
            }
        }

        // Формируем системный промпт
        String systemPrompt = buildSystemPrompt(user.getId(), chatMode, foodData);

        // Берём последние сообщения для контекста
        List<Map<String, String>> conversationHistory = getConversationHistory(user.getId());

        // Отправляем в ИИ
        String aiReply = aiService.chat(systemPrompt, conversationHistory);

        // В режиме дневника парсим и сохраняем в таблицу
        String displayReply = aiReply;
        String notification = null;
        if (chatMode == ChatMode.DIARY) {
            ParseResult result = parseMealDataAndSave(aiReply, user);
            displayReply = result.displayText;
            notification = result.notification;
        }

        // Сохраняем ответ ИИ (без JSON-блока)
        Message assistantMessage = new Message();
        assistantMessage.setUser(user);
        assistantMessage.setRole(Role.ASSISTANT);
        assistantMessage.setContent(displayReply);
        assistantMessage.setChatMode(chatMode);
        messageRepository.save(assistantMessage);

        return new ChatResponse(displayReply, chatMode.name(), notification);
    }

    public ChatResponse sendMessageWithPhoto(String username, String message, String chatModeStr,
                                              String imageBase64, String mimeType) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        ChatMode chatMode = ChatMode.valueOf(chatModeStr);

        // Сохраняем сообщение пользователя (с пометкой что было фото)
        Message userMessage = new Message();
        userMessage.setUser(user);
        userMessage.setRole(Role.USER);
        userMessage.setContent("[Фото] " + message);
        userMessage.setChatMode(chatMode);
        messageRepository.save(userMessage);

        // Формируем системный промпт
        String systemPrompt = buildSystemPrompt(user.getId(), chatMode, null);

        // Берём историю
        List<Map<String, String>> conversationHistory = getConversationHistory(user.getId());

        // Отправляем в ИИ с изображением
        String aiReply = aiService.chatWithImage(systemPrompt, conversationHistory, imageBase64, mimeType);

        // В режиме дневника парсим и сохраняем в таблицу
        String displayReply = aiReply;
        String notification = null;
        if (chatMode == ChatMode.DIARY) {
            ParseResult result = parseMealDataAndSave(aiReply, user);
            displayReply = result.displayText;
            notification = result.notification;
        }

        // Сохраняем ответ ИИ (без JSON-блока)
        Message assistantMessage = new Message();
        assistantMessage.setUser(user);
        assistantMessage.setRole(Role.ASSISTANT);
        assistantMessage.setContent(displayReply);
        assistantMessage.setChatMode(chatMode);
        messageRepository.save(assistantMessage);

        return new ChatResponse(displayReply, chatMode.name(), notification);
    }

    public List<MessageResponse> getHistory(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return messageRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(MessageResponse::from)
                .collect(Collectors.toList());
    }

    private String buildSystemPrompt(Long userId, ChatMode chatMode, String foodData) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Ты — ИИ-помощник в приложении для подсчёта калорий. Отвечай на русском языке.\n");

        // Данные профиля
        var profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile != null) {
            prompt.append("\n## Данные пользователя\n");
            if (profile.getGender() != null) {
                prompt.append("- Пол: ").append(profile.getGender() == UserProfile.Gender.MALE ? "мужской" : "женский").append("\n");
            }
            if (profile.getAge() != null) prompt.append("- Возраст: ").append(profile.getAge()).append("\n");
            if (profile.getHeight() != null) prompt.append("- Рост: ").append(profile.getHeight()).append(" см\n");
            if (profile.getWeight() != null) prompt.append("- Вес: ").append(profile.getWeight()).append(" кг\n");
            if (profile.getActivityLevel() != null) {
                String activity = switch (profile.getActivityLevel()) {
                    case SEDENTARY -> "сидячий образ жизни";
                    case LIGHT -> "лёгкая активность (1-2 раза/нед)";
                    case MODERATE -> "умеренная активность (3-4 раза/нед)";
                    case ACTIVE -> "активный (5-6 раз/нед)";
                    case VERY_ACTIVE -> "очень активный (каждый день)";
                };
                prompt.append("- Активность: ").append(activity).append("\n");
            }
            if (profile.getGoal() != null) {
                String goal = switch (profile.getGoal()) {
                    case LOSE_WEIGHT -> "похудеть";
                    case GAIN_WEIGHT -> "набрать вес";
                    case MAINTAIN_WEIGHT -> "поддерживать вес";
                    case BUILD_MUSCLE -> "набрать мышечную массу";
                };
                prompt.append("- Цель: ").append(goal).append("\n");
            }
        }

        // Привычки пользователя
        String habitsText = userHabitService.getHabitsForPrompt(userId);
        if (habitsText != null) {
            prompt.append("\n## Привычки пользователя\n");
            prompt.append("Учитывай эти привычки при подсчёте калорий:\n");
            prompt.append(habitsText);
            prompt.append("Если пользователь говорит продукт из привычки — автоматически учитывай добавки.\n");
        }

        if (chatMode == ChatMode.DIARY) {
            prompt.append("""

                    ## Режим: ДНЕВНИК
                    Пользователь записывает что он ел или просит изменить/удалить записи. Твоя задача:

                    ### Если пользователь сообщает о еде:
                    1. Определи все продукты/блюда из сообщения пользователя.
                    2. Для каждого продукта укажи:
                       - Название
                       - Примерный вес порции (если пользователь не указал — оцени стандартную порцию)
                       - Калории (ккал)
                       - Белки (г), Жиры (г), Углеводы (г)
                    3. Покажи итого по всем продуктам.

                    Формат ответа:
                    🍽 [Название] — [вес]г
                    Ккал: [число] | Б: [число]г | Ж: [число]г | У: [число]г

                    📊 Итого: [ккал] ккал | Б: [число]г | Ж: [число]г | У: [число]г

                    После основного ответа добавь:
                    "Для более точного подсчёта уточни:" и перечисли 2-3 вопроса (вес порции, способ приготовления, добавки).

                    ВАЖНО: В самом конце ответа ОБЯЗАТЕЛЬНО добавь блок данных для записи в таблицу в формате:
                    ```json
                    [{"name":"Название продукта","weight":вес_в_граммах,"calories":ккал,"protein":белки,"fat":жиры,"carbs":углеводы}]
                    ```

                    ### Если пользователь просит удалить запись:
                    Примеры: "убери пиццу", "удали гречку из сегодня", "я не ел борщ"
                    Ответь подтверждением удаления.
                    В JSON-блоке используй формат удаления:
                    ```json
                    [{"action":"delete","name":"Пицца"}]
                    ```

                    ### Если пользователь просит изменить запись:
                    Примеры: "замени пиццу на салат", "измени вес гречки на 200г"
                    Ответь подтверждением изменения.
                    Для замены используй удаление старого + добавление нового:
                    ```json
                    [{"action":"delete","name":"Пицца"},{"name":"Салат","weight":200,"calories":120,"protein":5,"fat":3,"carbs":15}]
                    ```

                    Этот JSON-блок будет автоматически удалён из отображаемого ответа и использован для записи/удаления в таблице питания.
                    Числа в JSON должны быть числами (не строками). Всегда добавляй этот блок когда пользователь сообщает о еде или просит изменить/удалить записи.

                    ### Привычки
                    Если пользователь упоминает привычку (например "я всегда пью чай с сахаром", "обычно ем кашу с маслом", "мой кофе = латте"), добавь в JSON-блок:
                    {"action":"add_habit","text":"описание привычки"}
                    Пример: пользователь говорит "я всегда пью чай с двумя ложками сахара" → добавь запись еды И привычку:
                    ```json
                    [{"name":"Чай с сахаром","weight":250,"calories":40,"protein":0,"fat":0,"carbs":10},{"action":"add_habit","text":"Чай = чай + 2 ложки сахара (+20 ккал)"}]
                    ```
                    Не добавляй привычку если пользователь просто перечисляет еду без указания на привычку.

                    ### Настроение
                    Если пользователь сообщает своё настроение (например "настроение отличное", "чувствую себя хорошо", "устал"), добавь в JSON-блок:
                    {"action":"set_mood","mood":"краткое описание настроения"}
                    Пример: "настроение супер" → {"action":"set_mood","mood":"Отличное"}
                    Настроение записывается один раз в день.

                    Будь кратким. Не добавляй лишних рассуждений.
                    """);

            // Проверяем, нужно ли спросить настроение (раз в день, при первой записи)
            boolean moodRecorded = mealEntryRepository.findFirstByUserIdAndMealDateAndMoodIsNotNull(userId, LocalDate.now()).isPresent();
            boolean hasEntriesToday = !mealEntryRepository.findByUserIdAndMealDateAndEntryType(userId, LocalDate.now(), MealEntry.EntryType.MEAL).isEmpty();
            if (!moodRecorded && !hasEntriesToday) {
                prompt.append("\nВАЖНО: Это первая запись еды пользователя за сегодня. После обработки еды, спроси какое у него настроение сегодня (коротко, одним предложением). Например: \"Кстати, как настроение сегодня?\" Не спрашивай если пользователь уже указал настроение в сообщении.\n");
            }

            // Добавляем данные из USDA если нашлись
            if (foodData != null) {
                prompt.append("\n## Справочные данные\n");
                prompt.append("Используй эти данные из базы USDA для точного расчёта:\n");
                prompt.append(foodData);
                prompt.append("\nОпирайся на эти цифры, но учитывай способ приготовления и размер порции.\n");
            }

        } else {
            prompt.append("""

                    ## Режим: ВОПРОС
                    Пользователь задаёт вопрос о питании, калориях, продуктах или здоровье.
                    Ничего не записывай в дневник. Просто ответь на вопрос.
                    Отвечай кратко и по делу. Если вопрос требует развёрнутого ответа — структурируй его списком.
                    """);
        }

        return prompt.toString();
    }

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("```json\\s*(\\[.*?])\\s*```", Pattern.DOTALL);

    private record ParseResult(String displayText, String notification) {}

    @org.springframework.transaction.annotation.Transactional
    private ParseResult parseMealDataAndSave(String aiReply, User user) {
        Matcher matcher = JSON_BLOCK_PATTERN.matcher(aiReply);
        if (!matcher.find()) {
            log.debug("JSON-блок не найден в ответе ИИ");
            return new ParseResult(aiReply, null);
        }

        String jsonStr = matcher.group(1);
        List<String> savedNames = new ArrayList<>();
        List<String> deletedNames = new ArrayList<>();
        List<String> habitNames = new ArrayList<>();
        double totalCal = 0;

        try {
            List<Map<String, Object>> items = objectMapper.readValue(jsonStr, new TypeReference<>() {});

            for (Map<String, Object> item : items) {
                String action = (String) item.get("action");

                if ("set_mood".equals(action)) {
                    String moodText = (String) item.get("mood");
                    if (moodText != null && !moodText.isBlank()) {
                        // Записываем настроение на первую запись дня (если ещё не записано)
                        var existingMood = mealEntryRepository.findFirstByUserIdAndMealDateAndMoodIsNotNull(user.getId(), LocalDate.now());
                        if (existingMood.isEmpty()) {
                            // Найдём первую MEAL-запись за сегодня и установим mood
                            var todayEntries = mealEntryRepository.findByUserIdAndMealDateAndEntryType(user.getId(), LocalDate.now(), MealEntry.EntryType.MEAL);
                            if (!todayEntries.isEmpty()) {
                                var firstEntry = todayEntries.get(0);
                                firstEntry.setMood(moodText);
                                mealEntryRepository.save(firstEntry);
                            }
                            habitNames.add("Настроение: " + moodText);
                            log.info("Записано настроение '{}' для {}", moodText, user.getUsername());
                        }
                    }
                } else if ("add_habit".equals(action)) {
                    String habitText = (String) item.get("text");
                    if (habitText != null && !habitText.isBlank()) {
                        userHabitService.addHabitFromAi(user.getId(), habitText);
                        habitNames.add(habitText);
                    }
                } else if ("delete".equals(action)) {
                    // Удаление записи по имени за сегодня
                    String foodName = (String) item.get("name");
                    if (foodName != null) {
                        List<MealEntry> found = mealEntryRepository
                                .findByUserIdAndMealDateAndFoodNameContainingIgnoreCase(user.getId(), LocalDate.now(), foodName);
                        if (!found.isEmpty()) {
                            mealEntryRepository.delete(found.get(0));
                            deletedNames.add(foodName);
                            log.info("Удалена запись '{}' для {}", foodName, user.getUsername());
                        } else {
                            log.info("Запись '{}' не найдена для удаления у {}", foodName, user.getUsername());
                        }
                    }
                } else {
                    // Добавление записи
                    MealEntry entry = new MealEntry();
                    entry.setUser(user);
                    entry.setFoodName((String) item.get("name"));
                    entry.setWeight(toDouble(item.get("weight")));
                    entry.setCalories(toDouble(item.get("calories")));
                    entry.setProtein(toDouble(item.get("protein")));
                    entry.setFat(toDouble(item.get("fat")));
                    entry.setCarbs(toDouble(item.get("carbs")));
                    entry.setMealDate(LocalDate.now());
                    mealEntryRepository.save(entry);

                    savedNames.add((String) item.get("name"));
                    Double cal = toDouble(item.get("calories"));
                    if (cal != null) totalCal += cal;
                }
            }

            log.info("Обработано {} команд для {}", items.size(), user.getUsername());
        } catch (Exception e) {
            log.warn("Не удалось распарсить JSON из ответа ИИ: {}", e.getMessage());
            return new ParseResult(aiReply, null);
        }

        // Формируем уведомление
        List<String> notifications = new ArrayList<>();
        if (!savedNames.isEmpty()) {
            String foods = String.join(", ", savedNames);
            notifications.add(String.format("Записано в таблицу: %s (%d ккал)", foods, Math.round(totalCal)));
        }
        if (!deletedNames.isEmpty()) {
            String foods = String.join(", ", deletedNames);
            notifications.add(String.format("Удалено из таблицы: %s", foods));
        }
        if (!habitNames.isEmpty()) {
            String habits = String.join("; ", habitNames);
            notifications.add(String.format("Запомнил привычку: %s", habits));
        }
        String notification = notifications.isEmpty() ? null : String.join("\n", notifications);

        // Убираем JSON-блок из отображаемого ответа
        String displayText = matcher.replaceAll("").trim();
        return new ParseResult(displayText, notification);
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<Map<String, String>> getConversationHistory(Long userId) {
        var messages = messageRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, String>> history = new ArrayList<>();
        // Переворачиваем обратно в хронологическом порядке
        for (int i = messages.size() - 1; i >= 0; i--) {
            var msg = messages.get(i);
            String role = msg.getRole() == Role.USER ? "user" : "assistant";
            history.add(Map.of("role", role, "content", msg.getContent()));
        }
        return history;
    }
}
