package com.caloriecounter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class WeeklySummaryResponse {
    private LocalDate weekStart;
    private LocalDate weekEnd;
    private List<DaySummaryRow> days;
    private Double avgCalories;
    private Double avgProtein;
    private Double avgFat;
    private Double avgCarbs;
    private Double dailyNorm;
    private int daysWithData;
    private String aiComment;

    @Data
    @AllArgsConstructor
    public static class DaySummaryRow {
        private LocalDate date;
        private Double totalCalories;
        private Double totalProtein;
        private Double totalFat;
        private Double totalCarbs;
        private int entryCount;
    }
}
