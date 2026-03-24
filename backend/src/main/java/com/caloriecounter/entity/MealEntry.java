package com.caloriecounter.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_entries")
@Data
public class MealEntry {

    public enum EntryType { MEAL, WATER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType entryType = EntryType.MEAL;

    @Column(nullable = false)
    private String foodName;

    private Double weight; // граммы (для воды — миллилитры)

    @Column(nullable = false)
    private Double calories;

    private Double protein;
    private Double fat;
    private Double carbs;

    private String mood; // настроение за день (заполняется на первой записи дня)

    @Column(nullable = false)
    private LocalDate mealDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (mealDate == null) mealDate = LocalDate.now();
        if (entryType == null) entryType = EntryType.MEAL;
    }
}
