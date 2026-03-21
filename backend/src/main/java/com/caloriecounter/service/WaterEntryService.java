package com.caloriecounter.service;

import com.caloriecounter.dto.WaterDailyResponse;
import com.caloriecounter.dto.WaterEntryResponse;
import com.caloriecounter.entity.WaterEntry;
import com.caloriecounter.repository.UserRepository;
import com.caloriecounter.repository.WaterEntryRepository;
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

    private final WaterEntryRepository waterEntryRepository;
    private final UserRepository userRepository;

    public WaterEntryResponse addWater(String username, Integer amount) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        WaterEntry entry = new WaterEntry();
        entry.setUser(user);
        entry.setAmount(amount);
        entry.setEntryDate(LocalDate.now());
        waterEntryRepository.save(entry);

        log.info("Вода добавлена для {}: {} мл", username, amount);
        return WaterEntryResponse.from(entry);
    }

    public WaterDailyResponse getDailyWater(String username, LocalDate date) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<WaterEntry> entries = waterEntryRepository
                .findByUserIdAndEntryDateOrderByCreatedAtAsc(user.getId(), date);

        int totalMl = entries.stream()
                .mapToInt(WaterEntry::getAmount)
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

        waterEntryRepository.deleteByIdAndUserId(entryId, user.getId());
        log.info("Запись воды {} удалена для {}", entryId, username);
    }
}
