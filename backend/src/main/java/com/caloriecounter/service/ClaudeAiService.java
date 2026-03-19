package com.caloriecounter.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "claude")
public class ClaudeAiService implements AiService {

    private final WebClient webClient;
    private final String model;

    public ClaudeAiService(
            @Value("${app.ai.claude.api-key}") String apiKey,
            @Value("${app.ai.claude.model}") String model) {
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.anthropic.com")
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .build();
    }

    @Override
    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1024,
                "system", systemPrompt,
                "messages", messages
        );

        Map response = webClient.post()
                .uri("/v1/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null) {
            throw new RuntimeException("Пустой ответ от Claude API");
        }

        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        return (String) content.get(0).get("text");
    }

    @Override
    public String chatWithImage(String systemPrompt, List<Map<String, String>> messages,
                                String imageBase64, String mimeType) {
        // TODO: реализовать поддержку изображений для Claude
        return chat(systemPrompt, messages);
    }
}
