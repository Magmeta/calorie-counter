package com.caloriecounter.dto;

import com.caloriecounter.entity.UserProfile;
import com.caloriecounter.entity.UserProfile.ActivityLevel;
import com.caloriecounter.entity.UserProfile.Gender;
import com.caloriecounter.entity.UserProfile.Goal;
import lombok.Data;

@Data
public class ProfileResponse {
    private Double height;
    private Double weight;
    private Integer age;
    private Gender gender;
    private ActivityLevel activityLevel;
    private Goal goal;
    private Double dailyCalorieNorm;

    public static ProfileResponse from(UserProfile profile) {
        ProfileResponse response = new ProfileResponse();
        response.setHeight(profile.getHeight());
        response.setWeight(profile.getWeight());
        response.setAge(profile.getAge());
        response.setGender(profile.getGender());
        response.setActivityLevel(profile.getActivityLevel());
        response.setGoal(profile.getGoal());
        response.setDailyCalorieNorm(calculateDailyNorm(profile));
        return response;
    }

    /**
     * Формула Миффлина-Сан Жеора — считает базовый метаболизм (BMR),
     * потом умножает на коэффициент активности и корректирует по цели.
     */
    private static Double calculateDailyNorm(UserProfile profile) {
        if (profile.getWeight() == null || profile.getHeight() == null
                || profile.getAge() == null || profile.getGender() == null
                || profile.getActivityLevel() == null || profile.getGoal() == null) {
            return null;
        }

        double bmr;
        if (profile.getGender() == Gender.MALE) {
            bmr = 10 * profile.getWeight() + 6.25 * profile.getHeight() - 5 * profile.getAge() + 5;
        } else {
            bmr = 10 * profile.getWeight() + 6.25 * profile.getHeight() - 5 * profile.getAge() - 161;
        }

        double activityMultiplier = switch (profile.getActivityLevel()) {
            case SEDENTARY -> 1.2;
            case LIGHT -> 1.375;
            case MODERATE -> 1.55;
            case ACTIVE -> 1.725;
            case VERY_ACTIVE -> 1.9;
        };

        double tdee = bmr * activityMultiplier;

        return switch (profile.getGoal()) {
            case LOSE_WEIGHT -> Math.round(tdee * 0.85 * 10.0) / 10.0;     // -15%
            case GAIN_WEIGHT -> Math.round(tdee * 1.15 * 10.0) / 10.0;     // +15%
            case MAINTAIN_WEIGHT -> Math.round(tdee * 10.0) / 10.0;
            case BUILD_MUSCLE -> Math.round(tdee * 1.20 * 10.0) / 10.0;    // +20%
        };
    }
}
