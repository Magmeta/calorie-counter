package com.caloriecounter.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * Сервис для поиска продуктов в базе USDA FoodData Central.
 * Используется для получения точных данных о калориях и БЖУ.
 */
@Service
@Slf4j
public class FoodDatabaseService {

    private final WebClient webClient;
    private final String apiKey;

    public FoodDatabaseService(@Value("${app.usda.api-key:DEMO_KEY}") String apiKey) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.nal.usda.gov/fdc")
                .build();
    }

    /**
     * Ищет продукт в базе USDA и возвращает строку с данными о БЖУ.
     * Если ничего не найдено — возвращает null.
     */
    public String searchFood(String query) {
        try {
            Map response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/foods/search")
                            .queryParam("api_key", apiKey)
                            .queryParam("query", query)
                            .queryParam("pageSize", 3)
                            .queryParam("dataType", "Foundation,SR Legacy")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) return null;

            List<Map<String, Object>> foods = (List<Map<String, Object>>) response.get("foods");
            if (foods == null || foods.isEmpty()) return null;

            StringBuilder result = new StringBuilder();
            result.append("Данные из базы USDA (на 100г):\n");

            for (Map<String, Object> food : foods) {
                String name = (String) food.get("description");
                result.append("- ").append(name).append(": ");

                List<Map<String, Object>> nutrients = (List<Map<String, Object>>) food.get("foodNutrients");
                if (nutrients != null) {
                    for (Map<String, Object> nutrient : nutrients) {
                        String nutrientName = (String) nutrient.get("nutrientName");
                        Number value = (Number) nutrient.get("value");
                        if (value == null) continue;

                        if ("Energy".equals(nutrientName)) {
                            result.append("Ккал: ").append(value).append(", ");
                        } else if ("Protein".equals(nutrientName)) {
                            result.append("Б: ").append(value).append("г, ");
                        } else if ("Total lipid (fat)".equals(nutrientName)) {
                            result.append("Ж: ").append(value).append("г, ");
                        } else if ("Carbohydrate, by difference".equals(nutrientName)) {
                            result.append("У: ").append(value).append("г, ");
                        }
                    }
                }
                result.append("\n");
            }

            return result.toString();
        } catch (Exception e) {
            log.warn("Ошибка поиска в USDA: {}", e.getMessage());
            return null;
        }
    }
}
