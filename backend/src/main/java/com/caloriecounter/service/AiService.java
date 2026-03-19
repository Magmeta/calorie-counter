package com.caloriecounter.service;

import java.util.List;
import java.util.Map;

public interface AiService {

    String chat(String systemPrompt, List<Map<String, String>> messages);

    /**
     * Чат с изображением. Base64-encoded картинка отправляется вместе с текстом.
     */
    String chatWithImage(String systemPrompt, List<Map<String, String>> messages,
                         String imageBase64, String mimeType);
}
