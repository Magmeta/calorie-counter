package com.caloriecounter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class WaterDailyResponse {
    private LocalDate date;
    private Integer totalMl;
    private List<WaterEntryResponse> entries;
}
