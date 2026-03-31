package com.caloriecounter.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class GeminiAiService implements AiService {

    private final WebClient webClient;
    private final String model;
    private final String apiKey;

    public GeminiAiService(
            @Value("${app.ai.gemini.api-key}") String apiKey,
            @Value("${app.ai.gemini.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    @Override
    public String chat(String systemPrompt, List<Map<String, String>> messages) {
        List<Map<String, Object>> contents = buildContents(systemPrompt, messages);
        return sendRequest(contents);
    }

    @Override
    public String chatWithImage(String systemPrompt, List<Map<String, String>> messages,
                                String imageBase64, String mimeType) {
        List<Map<String, Object>> contents = buildContents(systemPrompt, messages);

        // Заменяем последнее сообщение пользователя — добавляем к нему изображение
        if (!contents.isEmpty()) {
            int lastIndex = contents.size() - 1;
            Map<String, Object> lastMsg = contents.get(lastIndex);

            if ("user".equals(lastMsg.get("role"))) {
                List<Map<String, Object>> parts = new ArrayList<>((List<Map<String, Object>>) lastMsg.get("parts"));

                // Добавляем изображение перед текстом
                Map<String, Object> imagePart = new HashMap<>();
                Map<String, String> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", imageBase64);
                imagePart.put("inline_data", inlineData);

                parts.add(0, imagePart);

                Map<String, Object> updatedMsg = new HashMap<>();
                updatedMsg.put("role", "user");
                updatedMsg.put("parts", parts);
                contents.set(lastIndex, updatedMsg);
            }
        }

        return sendRequest(contents);
    }

    private List<Map<String, Object>> buildContents(String systemPrompt, List<Map<String, String>> messages) {
        List<Map<String, Object>> contents = new ArrayList<>();

        // Системный промпт
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", systemPrompt))
        ));
        contents.add(Map.of(
                "role", "model",
                "parts", List.of(Map.of("text", "Понял, буду следовать этим инструкциям."))
        ));

        // История сообщений
        for (Map<String, String> msg : messages) {
            String role = "user".equals(msg.get("role")) ? "user" : "model";
            contents.add(Map.of(
                    "role", role,
                    "parts", List.of(Map.of("text", msg.get("content")))
            ));
        }

        return contents;
    }

    private String sendRequest(List<Map<String, Object>> contents) {
        Map<String, Object> body = Map.of("contents", contents);

        Map response;
        try {
            response = webClient.post()
                    .uri("/v1beta/models/{model}:generateContent?key={key}", model, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();
        } catch (WebClientResponseException.TooManyRequests e) {
            log.warn("Gemini API: превышен лимит запросов (429)");
            throw new RuntimeException("Превышен лимит запросов к ИИ. Подождите минуту и попробуйте снова.");
        } catch (WebClientResponseException e) {
            log.error("Gemini API ошибка {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Ошибка ИИ-сервиса: " + e.getStatusCode());
        } catch (Exception e) {
            if (e.getCause() instanceof TimeoutException) {
                log.warn("Gemini API: таймаут (30 сек)");
                throw new RuntimeException("ИИ не ответил вовремя. Попробуйте ещё раз.");
            }
            log.error("Gemini API: неизвестная ошибка", e);
            throw new RuntimeException("Ошибка соединения с ИИ: " + e.getMessage());
        }

        if (response == null) {
            throw new RuntimeException("Пустой ответ от Gemini API");
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            log.warn("Gemini API: пустой список candidates, response: {}", response);
            throw new RuntimeException("ИИ не смог сгенерировать ответ. Попробуйте переформулировать.");
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }
}
