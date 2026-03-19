package com.caloriecounter.dto;

import com.caloriecounter.entity.MealEntry;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class MealEntryResponse {
    private Long id;
    private String foodName;
    private Double weight;
    private Double calories;
    private Double protein;
    private Double fat;
    private Double carbs;
    private LocalDate mealDate;

    public static MealEntryResponse from(MealEntry entry) {
        return new MealEntryResponse(
                entry.getId(),
                entry.getFoodName(),
                entry.getWeight(),
                entry.getCalories(),
                entry.getProtein(),
                entry.getFat(),
                entry.getCarbs(),
                entry.getMealDate()
        );
    }
}
