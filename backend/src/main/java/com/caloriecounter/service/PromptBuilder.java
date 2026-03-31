package com.caloriecounter.service;

import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.Message.ChatMode;
import com.caloriecounter.entity.UserProfile;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PromptBuilder {

    private final UserProfileRepository userProfileRepository;
    private final UserHabitService userHabitService;
    private final MealEntryRepository mealEntryRepository;

    public String buildSystemPrompt(Long userId, ChatMode chatMode, String foodData) {
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
                    ВАЖНО: JSON-блок с {"action":"add_habit"} ОБЯЗАТЕЛЕН для сохранения привычки. Без JSON-блока привычка НЕ будет записана.
                    Даже если пользователь только сообщает привычку без еды — всё равно добавь JSON-блок:
                    ```json
                    [{"action":"add_habit","text":"описание привычки"}]
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
}
