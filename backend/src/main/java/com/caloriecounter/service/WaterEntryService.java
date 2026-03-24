package com.caloriecounter.service;

import com.caloriecounter.dto.WaterDailyResponse;
import com.caloriecounter.dto.WaterEntryResponse;
import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.MealEntry.EntryType;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WaterEntryService {

    private final MealEntryRepository mealEntryRepository;
    private final UserRepository userRepository;

    public WaterEntryResponse addWater(String username, Integer amount) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        MealEntry entry = new MealEntry();
        entry.setUser(user);
        entry.setEntryType(EntryType.WATER);
        entry.setFoodName("Вода");
        entry.setWeight(amount.doubleValue());
        entry.setCalories(0.0);
        entry.setMealDate(LocalDate.now());
        mealEntryRepository.save(entry);

        log.info("Вода добавлена для {}: {} мл", username, amount);
        return WaterEntryResponse.from(entry);
    }

    public WaterDailyResponse getDailyWater(String username, LocalDate date) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<MealEntry> entries = mealEntryRepository
                .findByUserIdAndMealDateAndEntryType(user.getId(), date, EntryType.WATER);

        int totalMl = entries.stream()
                .mapToInt(e -> e.getWeight() != null ? e.getWeight().intValue() : 0)
                .sum();

        List<WaterEntryResponse> entryResponses = entries.stream()
                .map(WaterEntryResponse::from)
                .collect(Collectors.toList());

        return new WaterDailyResponse(date, totalMl, entryResponses);
    }

    @Transactional
    public void deleteWater(String username, Long entryId) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        mealEntryRepository.deleteByIdAndUserId(entryId, user.getId());
        log.info("Запись воды {} удалена для {}", entryId, username);
    }
}
