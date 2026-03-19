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
        if (chatMode == ChatMode.DIARY) {
            displayReply = parseMealDataAndSave(aiReply, user);
        }

        // Сохраняем ответ ИИ (без JSON-блока)
        Message assistantMessage = new Message();
        assistantMessage.setUser(user);
        assistantMessage.setRole(Role.ASSISTANT);
        assistantMessage.setContent(displayReply);
        assistantMessage.setChatMode(chatMode);
        messageRepository.save(assistantMessage);

        return new ChatResponse(displayReply, chatMode.name());
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
        if (chatMode == ChatMode.DIARY) {
            displayReply = parseMealDataAndSave(aiReply, user);
        }

        // Сохраняем ответ ИИ (без JSON-блока)
        Message assistantMessage = new Message();
        assistantMessage.setUser(user);
        assistantMessage.setRole(Role.ASSISTANT);
        assistantMessage.setContent(displayReply);
        assistantMessage.setChatMode(chatMode);
        messageRepository.save(assistantMessage);

        return new ChatResponse(displayReply, chatMode.name());
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

        if (chatMode == ChatMode.DIARY) {
            prompt.append("""

                    ## Режим: ДНЕВНИК
                    Пользователь записывает что он ел. Твоя задача:

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
                    Этот JSON-блок будет автоматически удалён из отображаемого ответа и использован для записи в таблицу питания.
                    Числа в JSON должны быть числами (не строками). Всегда добавляй этот блок когда пользователь сообщает о еде.

                    Будь кратким. Не добавляй лишних рассуждений.
                    """);

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

    private String parseMealDataAndSave(String aiReply, User user) {
        Matcher matcher = JSON_BLOCK_PATTERN.matcher(aiReply);
        if (!matcher.find()) {
            log.debug("JSON-блок не найден в ответе ИИ");
            return aiReply;
        }

        String jsonStr = matcher.group(1);
        try {
            List<Map<String, Object>> items = objectMapper.readValue(jsonStr, new TypeReference<>() {});

            for (Map<String, Object> item : items) {
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
            }

            log.info("Сохранено {} записей в таблицу питания для {}", items.size(), user.getUsername());
        } catch (Exception e) {
            log.warn("Не удалось распарсить JSON из ответа ИИ: {}", e.getMessage());
            return aiReply;
        }

        // Убираем JSON-блок из отображаемого ответа
        return matcher.replaceAll("").trim();
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
