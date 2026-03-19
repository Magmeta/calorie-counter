package com.caloriecounter.service;

import com.caloriecounter.dto.DailySummaryResponse;
import com.caloriecounter.dto.MealEntryResponse;
import com.caloriecounter.dto.ProfileResponse;
import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.User;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.UserProfileRepository;
import com.caloriecounter.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealEntryService {

    private final MealEntryRepository mealEntryRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public MealEntry addEntry(String username, String foodName, Double weight,
                               Double calories, Double protein, Double fat, Double carbs,
                               LocalDate date) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        MealEntry entry = new MealEntry();
        entry.setUser(user);
        entry.setFoodName(foodName);
        entry.setWeight(weight);
        entry.setCalories(calories);
        entry.setProtein(protein);
        entry.setFat(fat);
        entry.setCarbs(carbs);
        entry.setMealDate(date != null ? date : LocalDate.now());

        MealEntry saved = mealEntryRepository.save(entry);
        log.info("Записан приём пищи: {} для {}", foodName, username);
        return saved;
    }

    public DailySummaryResponse getDailySummary(String username, LocalDate date) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<MealEntry> entries = mealEntryRepository
                .findByUserIdAndMealDateOrderByCreatedAtAsc(user.getId(), date);

        List<MealEntryResponse> entryResponses = entries.stream()
                .map(MealEntryResponse::from)
                .collect(Collectors.toList());

        double totalCalories = entries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum();
        double totalProtein = entries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum();
        double totalFat = entries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum();
        double totalCarbs = entries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum();

        // Дневная норма из профиля
        Double dailyNorm = null;
        var profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            dailyNorm = ProfileResponse.from(profile).getDailyCalorieNorm();
        }

        return new DailySummaryResponse(date, entryResponses, totalCalories, totalProtein, totalFat, totalCarbs, dailyNorm);
    }

    @Transactional
    public void deleteEntry(String username, Long entryId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        mealEntryRepository.deleteByIdAndUserId(entryId, user.getId());
    }
}
