package com.caloriecounter.service;

import com.caloriecounter.dto.*;
import com.caloriecounter.dto.WeeklySummaryResponse.DaySummaryRow;
import com.caloriecounter.dto.MonthlySummaryResponse.WeekSummaryRow;
import com.caloriecounter.entity.MealEntry;
import com.caloriecounter.entity.User;
import com.caloriecounter.repository.MealEntryRepository;
import com.caloriecounter.repository.UserProfileRepository;
import com.caloriecounter.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MealEntryService {

    private final MealEntryRepository mealEntryRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    public MealEntry addEntry(String username, String foodName, Double weight,
                               Double calories, Double protein, Double fat, Double carbs,
                               LocalDate date) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        MealEntry entry = new MealEntry();
        entry.setUser(user);
        entry.setFoodName(foodName);
        entry.setWeight(weight);
        entry.setCalories(calories);
        entry.setProtein(protein);
        entry.setFat(fat);
        entry.setCarbs(carbs);
        entry.setMealDate(date != null ? date : LocalDate.now());

        MealEntry saved = mealEntryRepository.save(entry);
        log.info("Записан приём пищи: {} для {}", foodName, username);
        return saved;
    }

    public DailySummaryResponse getDailySummary(String username, LocalDate date) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<MealEntry> entries = mealEntryRepository
                .findByUserIdAndMealDateOrderByCreatedAtAsc(user.getId(), date);

        List<MealEntryResponse> entryResponses = entries.stream()
                .map(MealEntryResponse::from)
                .collect(Collectors.toList());

        double totalCalories = entries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum();
        double totalProtein = entries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum();
        double totalFat = entries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum();
        double totalCarbs = entries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum();

        // Дневная норма из профиля
        Double dailyNorm = null;
        var profile = userProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile != null) {
            dailyNorm = ProfileResponse.from(profile).getDailyCalorieNorm();
        }

        String aiComment = generateAiComment(totalCalories, totalProtein, totalFat, totalCarbs, dailyNorm);

        return new DailySummaryResponse(date, entryResponses, totalCalories, totalProtein, totalFat, totalCarbs, dailyNorm, aiComment);
    }

    public WeeklySummaryResponse getWeeklySummary(String username, LocalDate anyDayInWeek) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        LocalDate weekStart = anyDayInWeek.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = anyDayInWeek.with(DayOfWeek.SUNDAY);

        List<MealEntry> entries = mealEntryRepository
                .findByUserIdAndMealDateBetweenOrderByMealDateAscCreatedAtAsc(user.getId(), weekStart, weekEnd);

        // Группировка по дням
        Map<LocalDate, List<MealEntry>> byDate = entries.stream()
                .collect(Collectors.groupingBy(MealEntry::getMealDate));

        List<DaySummaryRow> days = new ArrayList<>();
        for (LocalDate d = weekStart; !d.isAfter(weekEnd); d = d.plusDays(1)) {
            List<MealEntry> dayEntries = byDate.getOrDefault(d, List.of());
            if (!dayEntries.isEmpty()) {
                days.add(new DaySummaryRow(
                        d,
                        dayEntries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum(),
                        dayEntries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum(),
                        dayEntries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum(),
                        dayEntries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum(),
                        dayEntries.size()
                ));
            }
        }

        int daysWithData = days.size();
        double avgCalories = daysWithData > 0 ? days.stream().mapToDouble(DaySummaryRow::getTotalCalories).average().orElse(0) : 0;
        double avgProtein = daysWithData > 0 ? days.stream().mapToDouble(DaySummaryRow::getTotalProtein).average().orElse(0) : 0;
        double avgFat = daysWithData > 0 ? days.stream().mapToDouble(DaySummaryRow::getTotalFat).average().orElse(0) : 0;
        double avgCarbs = daysWithData > 0 ? days.stream().mapToDouble(DaySummaryRow::getTotalCarbs).average().orElse(0) : 0;

        Double dailyNorm = getDailyNorm(user.getId());
        String aiComment = generateAiComment(avgCalories, avgProtein, avgFat, avgCarbs, dailyNorm);

        return new WeeklySummaryResponse(weekStart, weekEnd, days, avgCalories, avgProtein, avgFat, avgCarbs, dailyNorm, daysWithData, aiComment);
    }

    public MonthlySummaryResponse getMonthlySummary(String username, int year, int month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.with(TemporalAdjusters.lastDayOfMonth());

        List<MealEntry> entries = mealEntryRepository
                .findByUserIdAndMealDateBetweenOrderByMealDateAscCreatedAtAsc(user.getId(), monthStart, monthEnd);

        // Группировка по неделям
        Map<LocalDate, List<MealEntry>> byDate = entries.stream()
                .collect(Collectors.groupingBy(MealEntry::getMealDate));

        List<WeekSummaryRow> weeks = new ArrayList<>();
        LocalDate weekStart = monthStart.with(DayOfWeek.MONDAY);

        while (!weekStart.isAfter(monthEnd)) {
            LocalDate weekEnd = weekStart.plusDays(6);
            LocalDate effectiveStart = weekStart.isBefore(monthStart) ? monthStart : weekStart;
            LocalDate effectiveEnd = weekEnd.isAfter(monthEnd) ? monthEnd : weekEnd;

            List<Double> weekCalories = new ArrayList<>();
            List<Double> weekProtein = new ArrayList<>();
            List<Double> weekFat = new ArrayList<>();
            List<Double> weekCarbs = new ArrayList<>();

            for (LocalDate d = effectiveStart; !d.isAfter(effectiveEnd); d = d.plusDays(1)) {
                List<MealEntry> dayEntries = byDate.getOrDefault(d, List.of());
                if (!dayEntries.isEmpty()) {
                    weekCalories.add(dayEntries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum());
                    weekProtein.add(dayEntries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum());
                    weekFat.add(dayEntries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum());
                    weekCarbs.add(dayEntries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum());
                }
            }

            if (!weekCalories.isEmpty()) {
                weeks.add(new WeekSummaryRow(
                        effectiveStart, effectiveEnd,
                        weekCalories.stream().mapToDouble(Double::doubleValue).average().orElse(0),
                        weekProtein.stream().mapToDouble(Double::doubleValue).average().orElse(0),
                        weekFat.stream().mapToDouble(Double::doubleValue).average().orElse(0),
                        weekCarbs.stream().mapToDouble(Double::doubleValue).average().orElse(0),
                        weekCalories.size()
                ));
            }

            weekStart = weekStart.plusWeeks(1);
        }

        int totalDays = weeks.stream().mapToInt(WeekSummaryRow::getDaysWithData).sum();
        double avgCalories = totalDays > 0 ? entries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum() / totalDays : 0;
        double avgProtein = totalDays > 0 ? entries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum() / totalDays : 0;
        double avgFat = totalDays > 0 ? entries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum() / totalDays : 0;
        double avgCarbs = totalDays > 0 ? entries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum() / totalDays : 0;

        String monthName = Month.of(month).getDisplayName(TextStyle.FULL_STANDALONE, new Locale("ru"));
        Double dailyNorm = getDailyNorm(user.getId());
        String aiComment = generateAiComment(avgCalories, avgProtein, avgFat, avgCarbs, dailyNorm);

        return new MonthlySummaryResponse(year, month, monthName, weeks, avgCalories, avgProtein, avgFat, avgCarbs, dailyNorm, totalDays, aiComment);
    }

    public List<DailySummaryResponse> getCurrentWeekDays(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);

        List<DailySummaryResponse> days = new ArrayList<>();
        Double dailyNorm = getDailyNorm(user.getId());

        for (LocalDate d = weekStart; !d.isAfter(today); d = d.plusDays(1)) {
            List<MealEntry> entries = mealEntryRepository
                    .findByUserIdAndMealDateOrderByCreatedAtAsc(user.getId(), d);

            List<MealEntryResponse> entryResponses = entries.stream()
                    .map(MealEntryResponse::from)
                    .collect(Collectors.toList());

            double totalCalories = entries.stream().mapToDouble(e -> e.getCalories() != null ? e.getCalories() : 0).sum();
            double totalProtein = entries.stream().mapToDouble(e -> e.getProtein() != null ? e.getProtein() : 0).sum();
            double totalFat = entries.stream().mapToDouble(e -> e.getFat() != null ? e.getFat() : 0).sum();
            double totalCarbs = entries.stream().mapToDouble(e -> e.getCarbs() != null ? e.getCarbs() : 0).sum();

            String aiComment = generateAiComment(totalCalories, totalProtein, totalFat, totalCarbs, dailyNorm);
            days.add(new DailySummaryResponse(d, entryResponses, totalCalories, totalProtein, totalFat, totalCarbs, dailyNorm, aiComment));
        }

        return days;
    }

    public List<WeeklySummaryResponse> getCompletedWeeks(String username, int year, int month) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        LocalDate today = LocalDate.now();
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.with(TemporalAdjusters.lastDayOfMonth());
        LocalDate currentWeekStart = today.with(DayOfWeek.MONDAY);

        List<WeeklySummaryResponse> completedWeeks = new ArrayList<>();
        LocalDate weekStart = monthStart.with(DayOfWeek.MONDAY);

        while (!weekStart.isAfter(monthEnd)) {
            LocalDate weekEnd = weekStart.plusDays(6);

            // Пропускаем текущую незавершённую неделю
            if (!weekStart.isBefore(currentWeekStart)) {
                weekStart = weekStart.plusWeeks(1);
                continue;
            }

            // Получаем данные за эту неделю
            WeeklySummaryResponse weekSummary = getWeeklySummary(username, weekStart);
            if (weekSummary.getDaysWithData() > 0) {
                completedWeeks.add(weekSummary);
            }

            weekStart = weekStart.plusWeeks(1);
        }

        return completedWeeks;
    }

    public List<MonthlySummaryResponse> getCompletedMonths(String username, int year) {
        LocalDate today = LocalDate.now();
        int currentMonth = today.getYear() == year ? today.getMonthValue() : 13;

        List<MonthlySummaryResponse> completedMonths = new ArrayList<>();
        for (int m = 1; m < currentMonth; m++) {
            MonthlySummaryResponse monthSummary = getMonthlySummary(username, year, m);
            if (monthSummary.getDaysWithData() > 0) {
                completedMonths.add(monthSummary);
            }
        }

        return completedMonths;
    }

    private String generateAiComment(double calories, double protein, double fat, double carbs, Double dailyNorm) {
        if (calories == 0) return null;

        List<String> comments = new ArrayList<>();

        // Комментарий по калориям
        if (dailyNorm != null && dailyNorm > 0) {
            double percent = (calories / dailyNorm) * 100;
            if (percent < 50) {
                comments.add("Значительный недобор калорий — съедено менее 50% нормы");
            } else if (percent < 80) {
                comments.add("Небольшой недобор калорий");
            } else if (percent <= 120) {
                comments.add("Калории в пределах нормы");
            } else {
                comments.add("Перебор калорий — превышение нормы на " + Math.round(percent - 100) + "%");
            }
        }

        // Комментарий по балансу БЖУ
        double totalMacro = protein + fat + carbs;
        if (totalMacro > 0) {
            double proteinPct = (protein / totalMacro) * 100;
            double fatPct = (fat / totalMacro) * 100;
            double carbsPct = (carbs / totalMacro) * 100;

            // Идеальный баланс: ~30% белки, ~30% жиры, ~40% углеводы
            if (proteinPct < 15) {
                comments.add("Мало белка — добавьте мясо, рыбу или творог");
            }
            if (fatPct > 45) {
                comments.add("Много жиров — попробуйте менее жирные продукты");
            }
            if (carbsPct > 60) {
                comments.add("Много углеводов — сбалансируйте белками");
            }
        }

        return comments.isEmpty() ? null : String.join(". ", comments);
    }

    private Double getDailyNorm(Long userId) {
        var profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile != null) {
            return ProfileResponse.from(profile).getDailyCalorieNorm();
        }
        return null;
    }

    @Transactional
    public void deleteEntry(String username, Long entryId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        mealEntryRepository.deleteByIdAndUserId(entryId, user.getId());
    }
}
