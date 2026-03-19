package com.caloriecounter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {

    @NotBlank(message = "Сообщение не может быть пустым")
    private String message;

    @NotNull(message = "Режим чата обязателен")
    private String chatMode; // DIARY или QUESTION
}
