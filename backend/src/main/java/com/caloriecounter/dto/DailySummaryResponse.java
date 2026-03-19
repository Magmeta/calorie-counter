package com.caloriecounter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class DailySummaryResponse {
    private LocalDate date;
    private List<MealEntryResponse> entries;
    private Double totalCalories;
    private Double totalProtein;
    private Double totalFat;
    private Double totalCarbs;
    private Double dailyNorm;
}
