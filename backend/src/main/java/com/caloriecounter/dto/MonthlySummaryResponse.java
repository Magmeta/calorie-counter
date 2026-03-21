package com.caloriecounter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class MonthlySummaryResponse {
    private int year;
    private int month;
    private String monthName;
    private List<WeekSummaryRow> weeks;
    private Double avgCalories;
    private Double avgProtein;
    private Double avgFat;
    private Double avgCarbs;
    private Double dailyNorm;
    private int daysWithData;
    private String aiComment;

    @Data
    @AllArgsConstructor
    public static class WeekSummaryRow {
        private LocalDate weekStart;
        private LocalDate weekEnd;
        private Double avgCalories;
        private Double avgProtein;
        private Double avgFat;
        private Double avgCarbs;
        private int daysWithData;
    }
}
