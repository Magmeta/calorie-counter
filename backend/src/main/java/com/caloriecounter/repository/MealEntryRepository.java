package com.caloriecounter.repository;

import com.caloriecounter.entity.MealEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {

    List<MealEntry> findByUserIdAndMealDateOrderByCreatedAtAsc(Long userId, LocalDate date);

    List<MealEntry> findByUserIdAndMealDateBetweenOrderByMealDateAscCreatedAtAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    void deleteByIdAndUserId(Long id, Long userId);

    List<MealEntry> findByUserIdAndMealDateAndFoodNameContainingIgnoreCase(Long userId, LocalDate date, String foodName);
}
