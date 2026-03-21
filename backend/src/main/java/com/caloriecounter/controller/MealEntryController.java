package com.caloriecounter.controller;

import com.caloriecounter.dto.DailySummaryResponse;
import com.caloriecounter.dto.MonthlySummaryResponse;
import com.caloriecounter.dto.WeeklySummaryResponse;
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
}
