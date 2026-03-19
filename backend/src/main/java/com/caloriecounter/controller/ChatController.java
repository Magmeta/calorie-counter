package com.caloriecounter.controller;

import com.caloriecounter.dto.ChatRequest;
import com.caloriecounter.dto.ChatResponse;
import com.caloriecounter.dto.MessageResponse;
import com.caloriecounter.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChatRequest request) {
        try {
            return ResponseEntity.ok(chatService.sendMessage(userDetails.getUsername(), request));
        } catch (Exception e) {
            log.error("Ошибка при отправке сообщения: {}", e.getMessage());
            return ResponseEntity.ok(new ChatResponse(
                    "⚠️ " + e.getMessage(), request.getChatMode()));
        }
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatResponse> sendPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "message", defaultValue = "Что это за блюдо? Сколько здесь калорий?") String message,
            @RequestParam(value = "chatMode", defaultValue = "DIARY") String chatMode) throws IOException {

        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        try {
            return ResponseEntity.ok(
                    chatService.sendMessageWithPhoto(userDetails.getUsername(), message, chatMode, base64, mimeType));
        } catch (Exception e) {
            log.error("Ошибка при отправке фото: {}", e.getMessage());
            return ResponseEntity.ok(new ChatResponse("⚠️ " + e.getMessage(), chatMode));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<MessageResponse>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.getHistory(userDetails.getUsername()));
    }
}
