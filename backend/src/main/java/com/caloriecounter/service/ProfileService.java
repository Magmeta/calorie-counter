package com.caloriecounter.service;

import com.caloriecounter.dto.ProfileRequest;
import com.caloriecounter.dto.ProfileResponse;
import com.caloriecounter.entity.UserProfile;
import com.caloriecounter.repository.UserProfileRepository;
import com.caloriecounter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileResponse getProfile(String username) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        var profile = profileRepository.findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            return null;
        }

        return ProfileResponse.from(profile);
    }

    public ProfileResponse saveProfile(String username, ProfileRequest request) {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        var profile = profileRepository.findByUserId(user.getId())
                .orElse(new UserProfile());

        profile.setUser(user);
        profile.setHeight(request.getHeight());
        profile.setWeight(request.getWeight());
        profile.setAge(request.getAge());
        profile.setGender(request.getGender());
        profile.setActivityLevel(request.getActivityLevel());
        profile.setGoal(request.getGoal());

        profileRepository.save(profile);

        return ProfileResponse.from(profile);
    }
}
