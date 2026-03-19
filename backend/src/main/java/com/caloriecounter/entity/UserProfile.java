package com.caloriecounter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Double height; // рост в см

    private Double weight; // вес в кг

    private Integer age;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level")
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    public enum Gender {
        MALE, FEMALE
    }

    public enum ActivityLevel {
        SEDENTARY,      // сидячий образ жизни
        LIGHT,          // лёгкая активность (1-2 раза в неделю)
        MODERATE,       // умеренная (3-4 раза в неделю)
        ACTIVE,         // активный (5-6 раз в неделю)
        VERY_ACTIVE     // очень активный (каждый день / тяжёлый труд)
    }

    public enum Goal {
        LOSE_WEIGHT,        // похудеть
        GAIN_WEIGHT,        // набрать вес
        MAINTAIN_WEIGHT,    // поддерживать вес
        BUILD_MUSCLE        // набрать мышечную массу
    }
}
