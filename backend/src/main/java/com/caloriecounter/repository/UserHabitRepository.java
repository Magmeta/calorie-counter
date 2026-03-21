package com.caloriecounter.repository;

import com.caloriecounter.entity.UserHabit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserHabitRepository extends JpaRepository<UserHabit, Long> {

    List<UserHabit> findByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
