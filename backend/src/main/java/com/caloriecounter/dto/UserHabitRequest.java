package com.caloriecounter.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserHabitRequest {

    @NotBlank(message = "Текст привычки не может быть пустым")
    private String text;
}
