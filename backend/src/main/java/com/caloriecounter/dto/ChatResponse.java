package com.caloriecounter.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChatResponse {
    private String reply;
    private String chatMode;
    private String notification;

    public ChatResponse(String reply, String chatMode) {
        this.reply = reply;
        this.chatMode = chatMode;
        this.notification = null;
    }
}
