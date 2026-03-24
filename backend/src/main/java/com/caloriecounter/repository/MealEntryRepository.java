package com.caloriecounter.repository;

import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.MealEntry.EntryType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {

    List<MealEntry> findByUserIdAndMealDate(Long userId, LocalDate date);

    List<MealEntry> findByUserIdAndMealDateOrderByCreatedAtAsc(Long userId, LocalDate date);

    List<MealEntry> findByUserIdAndMealDateBetweenOrderByMealDateAscCreatedAtAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    void deleteByIdAndUserId(Long id, Long userId);

    List<MealEntry> findByUserIdAndMealDateAndFoodNameContainingIgnoreCase(Long userId, LocalDate date, String foodName);

    // Вода
    List<MealEntry> findByUserIdAndMealDateAndEntryType(Long userId, LocalDate date, EntryType entryType);

    // Настроение — найти запись с mood за дату
    Optional<MealEntry> findFirstByUserIdAndMealDateAndMoodIsNotNull(Long userId, LocalDate date);

    List<MealEntry> findByUserIdAndEntryTypeAndMealDateBetween(Long userId, EntryType entryType, LocalDate from, LocalDate to);

    // Только записи еды (без воды)
    List<MealEntry> findByUserIdAndMealDateAndEntryTypeOrderByCreatedAtAsc(Long userId, LocalDate date, EntryType entryType);

    List<MealEntry> findByUserIdAndEntryTypeAndMealDateBetweenOrderByMealDateAscCreatedAtAsc(
            Long userId, EntryType entryType, LocalDate startDate, LocalDate endDate);
}
