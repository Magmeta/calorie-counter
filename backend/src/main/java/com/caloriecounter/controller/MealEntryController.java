package com.caloriecounter.controller;

import com.caloriecounter.dto.DailySummaryResponse;
import com.caloriecounter.dto.MonthlySummaryResponse;
import com.caloriecounter.dto.MoodRequest;
import com.caloriecounter.dto.WeeklySummaryResponse;
import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.UserRepository;
import com.caloriecounter.service.MealEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meals")
@RequiredArgsConstructor
public class MealEntryController {

    private final MealEntryService mealEntryService;
    private final MealEntryRepository mealEntryRepository;
    private final UserRepository userRepository;

    @GetMapping("/daily")
    public ResponseEntity<DailySummaryResponse> getDailySummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(mealEntryService.getDailySummary(userDetails.getUsername(), date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<WeeklySummaryResponse> getWeeklySummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(mealEntryService.getWeeklySummary(userDetails.getUsername(), date));
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlySummaryResponse> getMonthlySummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        if (year == null) year = LocalDate.now().getYear();
        if (month == null) month = LocalDate.now().getMonthValue();
        return ResponseEntity.ok(mealEntryService.getMonthlySummary(userDetails.getUsername(), year, month));
    }

    @GetMapping("/current-week-days")
    public ResponseEntity<List<DailySummaryResponse>> getCurrentWeekDays(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mealEntryService.getCurrentWeekDays(userDetails.getUsername()));
    }

    @GetMapping("/completed-weeks")
    public ResponseEntity<List<WeeklySummaryResponse>> getCompletedWeeks(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        if (year == null) year = LocalDate.now().getYear();
        if (month == null) month = LocalDate.now().getMonthValue();
        return ResponseEntity.ok(mealEntryService.getCompletedWeeks(userDetails.getUsername(), year, month));
    }

    @GetMapping("/completed-months")
    public ResponseEntity<List<MonthlySummaryResponse>> getCompletedMonths(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return ResponseEntity.ok(mealEntryService.getCompletedMonths(userDetails.getUsername(), year));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        mealEntryService.deleteEntry(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mood")
    public ResponseEntity<?> getMood(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        var user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        var entry = mealEntryRepository.findFirstByUserIdAndMealDateAndMoodIsNotNull(user.getId(), date);
        return ResponseEntity.ok(entry.map(e -> java.util.Map.of("mood", e.getMood().name(), "date", e.getMealDate().toString()))
                .orElse(java.util.Map.of()));
    }

    @PostMapping("/mood")
    public ResponseEntity<?> setMood(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody MoodRequest request) {
        var user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Проверяем, не записано ли уже настроение за сегодня
        var existingMood = mealEntryRepository.findFirstByUserIdAndMealDateAndMoodIsNotNull(user.getId(), LocalDate.now());
        if (existingMood.isPresent()) {
            return ResponseEntity.ok(java.util.Map.of("status", "already_set"));
        }

        // Находим первую MEAL-запись за сегодня и устанавливаем mood
        var todayMeals = mealEntryRepository.findByUserIdAndMealDateAndEntryType(user.getId(), LocalDate.now(), MealEntry.EntryType.MEAL);
        if (todayMeals.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Нет записей еды за сегодня"));
        }

        var firstEntry = todayMeals.get(0);
        firstEntry.setMood(request.getMood());
        mealEntryRepository.save(firstEntry);

        return ResponseEntity.ok(java.util.Map.of("status", "ok", "mood", request.getMood().name()));
    }
}
