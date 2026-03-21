package com.caloriecounter.dto;

import com.caloriecounter.entity.UserHabit;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class UserHabitResponse {
    private Long id;
    private String habitText;
    private String source;
    private LocalDateTime createdAt;

    public static UserHabitResponse from(UserHabit habit) {
        return new UserHabitResponse(
                habit.getId(),
                habit.getHabitText(),
                habit.getSource().name(),
                habit.getCreatedAt()
        );
    }
}
