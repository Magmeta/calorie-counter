package com.caloriecounter.dto;

import com.caloriecounter.entity.UserProfile.ActivityLevel;
import com.caloriecounter.entity.UserProfile.Gender;
import com.caloriecounter.entity.UserProfile.Goal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileRequest {

    @NotNull(message = "Рост обязателен")
    @Min(value = 50, message = "Рост от 50 см")
    @Max(value = 300, message = "Рост до 300 см")
    private Double height;

    @NotNull(message = "Вес обязателен")
    @Min(value = 20, message = "Вес от 20 кг")
    @Max(value = 500, message = "Вес до 500 кг")
    private Double weight;

    @NotNull(message = "Возраст обязателен")
    @Min(value = 10, message = "Возраст от 10 лет")
    @Max(value = 150, message = "Возраст до 150 лет")
    private Integer age;

    @NotNull(message = "Пол обязателен")
    private Gender gender;

    @NotNull(message = "Уровень активности обязателен")
    private ActivityLevel activityLevel;

    @NotNull(message = "Цель обязательна")
    private Goal goal;
}
