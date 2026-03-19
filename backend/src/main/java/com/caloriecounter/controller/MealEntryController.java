package com.caloriecounter.controller;

import com.caloriecounter.dto.DailySummaryResponse;
import com.caloriecounter.service.MealEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        mealEntryService.deleteEntry(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
