package com.caloriecounter.controller;

import com.caloriecounter.dto.WaterDailyResponse;
import com.caloriecounter.dto.WaterEntryResponse;
import com.caloriecounter.service.WaterEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/water")
@RequiredArgsConstructor
public class WaterEntryController {

    private final WaterEntryService waterEntryService;

    @PostMapping
    public ResponseEntity<WaterEntryResponse> addWater(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Integer> body) {
        Integer amount = body.get("amount");
        if (amount == null || amount <= 0) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(waterEntryService.addWater(userDetails.getUsername(), amount));
    }

    @GetMapping("/daily")
    public ResponseEntity<WaterDailyResponse> getDailyWater(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(waterEntryService.getDailyWater(userDetails.getUsername(), date));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWater(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        waterEntryService.deleteWater(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
