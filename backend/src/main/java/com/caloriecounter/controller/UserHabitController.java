package com.caloriecounter.controller;

import com.caloriecounter.dto.UserHabitRequest;
import com.caloriecounter.dto.UserHabitResponse;
import com.caloriecounter.service.UserHabitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
public class UserHabitController {

    private final UserHabitService userHabitService;

    @GetMapping
    public ResponseEntity<List<UserHabitResponse>> getHabits(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userHabitService.getHabits(userDetails.getUsername()));
    }

    @PostMapping
    public ResponseEntity<UserHabitResponse> addHabit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserHabitRequest request) {
        return ResponseEntity.ok(userHabitService.addHabit(userDetails.getUsername(), request.getText()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHabit(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        userHabitService.deleteHabit(userDetails.getUsername(), id);
        return ResponseEntity.ok().build();
    }
}
