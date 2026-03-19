package com.caloriecounter.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_entries")
@Data
public class MealEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String foodName;

    private Double weight; // граммы

    @Column(nullable = false)
    private Double calories;

    private Double protein;
    private Double fat;
    private Double carbs;

    @Column(nullable = false)
    private LocalDate mealDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (mealDate == null) mealDate = LocalDate.now();
    }
}
