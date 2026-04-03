package com.caloriecounter.dto;

import com.caloriecounter.entity.MealEntry;
import lombok.Data;

@Data
public class MoodRequest {
    private MealEntry.Mood mood;
}
