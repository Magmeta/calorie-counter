package com.caloriecounter.dto;

import com.caloriecounter.entity.MealEntry;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class WaterEntryResponse {
    private Long id;
    private Integer amount;
    private LocalDate entryDate;
    private LocalDateTime createdAt;

    public static WaterEntryResponse from(MealEntry entry) {
        return new WaterEntryResponse(
                entry.getId(),
                entry.getWeight() != null ? entry.getWeight().intValue() : 0,
                entry.getMealDate(),
                entry.getCreatedAt()
        );
    }
}
