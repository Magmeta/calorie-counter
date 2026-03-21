package com.caloriecounter.service;

import com.caloriecounter.dto.UserHabitResponse;
import com.caloriecounter.entity.UserHabit;
import com.caloriecounter.repository.UserHabitRepository;
import com.caloriecounter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserHabitService {

    private final UserHabitRepository userHabitRepository;
    private final UserRepository userRepository;

    public List<UserHabitResponse> getHabits(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        return userHabitRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(UserHabitResponse::from)
                .collect(Collectors.toList());
    }

    public UserHabitResponse addHabit(String username, String text) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        UserHabit habit = new UserHabit();
        habit.setUser(user);
        habit.setHabitText(text);
        habit.setSource(UserHabit.Source.USER);
        userHabitRepository.save(habit);

        log.info("Привычка добавлена пользователем {}: {}", username, text);
        return UserHabitResponse.from(habit);
    }

    public UserHabitResponse addHabitFromAi(Long userId, String text) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        UserHabit habit = new UserHabit();
        habit.setUser(user);
        habit.setHabitText(text);
        habit.setSource(UserHabit.Source.AI);
        userHabitRepository.save(habit);

        log.info("Привычка добавлена ИИ для {}: {}", user.getUsername(), text);
        return UserHabitResponse.from(habit);
    }

    @Transactional
    public void deleteHabit(String username, Long habitId) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        userHabitRepository.deleteByIdAndUserId(habitId, user.getId());
        log.info("Привычка {} удалена пользователем {}", habitId, username);
    }

    public String getHabitsForPrompt(Long userId) {
        List<UserHabit> habits = userHabitRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (habits.isEmpty()) return null;

        StringBuilder sb = new StringBuilder();
        for (UserHabit habit : habits) {
            sb.append("- ").append(habit.getHabitText()).append("\n");
        }
        return sb.toString();
    }
}
