package com.caloriecounter.dto;

import com.caloriecounter.entity.Message;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageResponse {
    private Long id;
    private String role;
    private String content;
    private String chatMode;
    private LocalDateTime createdAt;

    public static MessageResponse from(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setRole(message.getRole().name());
        response.setContent(message.getContent());
        response.setChatMode(message.getChatMode().name());
        response.setCreatedAt(message.getCreatedAt());
        return response;
    }
}
