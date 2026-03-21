package com.caloriecounter.repository;

import com.caloriecounter.entity.WaterEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WaterEntryRepository extends JpaRepository<WaterEntry, Long> {

    List<WaterEntry> findByUserIdAndEntryDateOrderByCreatedAtAsc(Long userId, LocalDate date);

    List<WaterEntry> findByUserIdAndEntryDateBetweenOrderByEntryDateAsc(
            Long userId, LocalDate startDate, LocalDate endDate);

    void deleteByIdAndUserId(Long id, Long userId);
}
