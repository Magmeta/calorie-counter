"use client";

import { useEffect, useState } from "react";
import { apiRequest, getDailyWater } from "@/lib/api";
import { ChevronDown, Droplets } from "lucide-react";

interface MealEntry {
  id: number;
  foodName: string;
  weight: number | null;
  calories: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  mealDate: string;
}

interface DailySummary {
  date: string;
  entries: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  dailyNorm: number | null;
  aiComment: string | null;
}

interface DaySummaryRow {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  entryCount: number;
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  days: DaySummaryRow[];
  avgCalories: number;
  avgProtein: number;
  avgFat: number;
  avgCarbs: number;
  dailyNorm: number | null;
  daysWithData: number;
  aiComment: string | null;
}

interface WeekSummaryRow {
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgProtein: number;
  avgFat: number;
  avgCarbs: number;
  daysWithData: number;
}

interface MonthlySummary {
  year: number;
  month: number;
  monthName: string;
  weeks: WeekSummaryRow[];
  avgCalories: number;
  avgProtein: number;
  avgFat: number;
  avgCarbs: number;
  dailyNorm: number | null;
  daysWithData: number;
  aiComment: string | null;
}

type ViewMode = "daily" | "weekly" | "monthly";

export default function ProfileReports() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [weekDays, setWeekDays] = useState<DailySummary[]>([]);
  const [completedWeeks, setCompletedWeeks] = useState<WeeklySummary[]>([]);
  const [completedMonths, setCompletedMonths] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [viewMode]);

  async function loadData() {
    setLoading(true);
    try {
      if (viewMode === "daily") {
        const data = await apiRequest("/api/meals/current-week-days");
        setWeekDays(data);
      } else if (viewMode === "weekly") {
        const data = await apiRequest("/api/meals/completed-weeks");
        setCompletedWeeks(data);
      } else {
        const data = await apiRequest("/api/meals/completed-months");
        setCompletedMonths(data);
      }
    } catch { /* ошибка загрузки */ }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="flex-1 py-1.5 text-xs font-medium rounded-full transition-all"
            style={viewMode === mode
              ? { background: "linear-gradient(135deg, #179BB0, #16A085)", color: "#fff" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(134,205,217,0.7)" }
            }
          >
            {mode === "daily" ? "Дни" : mode === "weekly" ? "Недели" : "Месяцы"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8" style={{ color: "rgba(134,205,217,0.4)" }}>Загрузка...</div>
      ) : (
        <>
          {viewMode === "daily" && <DaysView days={weekDays} />}
          {viewMode === "weekly" && <WeeksView weeks={completedWeeks} />}
          {viewMode === "monthly" && <MonthsView months={completedMonths} />}
        </>
      )}
    </div>
  );
}

/* ===== Дни ===== */
function DaysView({ days }: { days: DailySummary[] }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [waterByDate, setWaterByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadWater() {
      const waterData: Record<string, number> = {};
      for (const day of days) {
        try {
          const data = await getDailyWater(day.date);
          waterData[day.date] = data.totalMl;
        } catch { /* ошибка */ }
      }
      setWaterByDate(waterData);
    }
    if (days.length > 0) loadWater();
  }, [days]);

  if (days.length === 0) {
    return <EmptyState text="Нет данных за текущую неделю" />;
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const isExpanded = expandedDate === day.date || (expandedDate === null && day.date === today);
        const hasEntries = day.entries.length > 0;

        return (
          <div key={day.date}>
            <button
              onClick={() => setExpandedDate(isExpanded ? "__none__" : day.date)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{formatDayLabel(day.date)}</span>
                {hasEntries && <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{day.entries.length} зап.</span>}
              </div>
              <div className="flex items-center gap-2">
                {hasEntries && <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>{Math.round(day.totalCalories)} ккал</span>}
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && hasEntries && (
              <div className="mt-1 space-y-2">
                {day.entries.map((e, i) => (
                  <div key={e.id} className="flex justify-between items-center px-3 py-2 text-sm rounded-xl"
                       style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)" }}>
                    <span className="text-white/90 truncate flex-1">{e.foodName}</span>
                    <div className="flex gap-3 text-xs ml-2" style={{ color: "#86CDD9" }}>
                      {e.weight && <span>{Math.round(e.weight)}г</span>}
                      <span className="font-semibold text-white">{Math.round(e.calories)} ккал</span>
                    </div>
                  </div>
                ))}
                <SummaryBar
                  calories={day.totalCalories}
                  protein={day.totalProtein}
                  fat={day.totalFat}
                  carbs={day.totalCarbs}
                  norm={day.dailyNorm}
                />
                {waterByDate[day.date] > 0 && (
                  <div className="flex items-center gap-1.5 text-xs px-3" style={{ color: "rgba(134,205,217,0.5)" }}>
                    <Droplets size={12} style={{ color: "#179BB0" }} />
                    {waterByDate[day.date]} / 2000 мл
                  </div>
                )}
              </div>
            )}

            {isExpanded && !hasEntries && (
              <div className="text-center text-sm py-2" style={{ color: "rgba(134,205,217,0.4)" }}>Нет записей</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Недели ===== */
function WeeksView({ weeks }: { weeks: WeeklySummary[] }) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  if (weeks.length === 0) {
    return <EmptyState text="Завершённых недель пока нет" />;
  }

  return (
    <div className="space-y-2">
      {weeks.map((week) => {
        const isExpanded = expandedWeek === week.weekStart;

        return (
          <div key={week.weekStart}>
            <button
              onClick={() => setExpandedWeek(isExpanded ? null : week.weekStart)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{formatWeekRange(week.weekStart, week.weekEnd)}</span>
                <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{week.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>~{Math.round(week.avgCalories)} ккал/д</span>
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-1 space-y-2">
                {week.days.map((d, i) => (
                  <div key={d.date} className="flex justify-between items-center px-3 py-2 text-sm rounded-xl"
                       style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)" }}>
                    <span className="text-white/90">{formatShortDate(d.date)}</span>
                    <span className="font-semibold text-white">{Math.round(d.totalCalories)} ккал</span>
                  </div>
                ))}
                <SummaryBar
                  calories={week.avgCalories}
                  protein={week.avgProtein}
                  fat={week.avgFat}
                  carbs={week.avgCarbs}
                  norm={week.dailyNorm}
                  label="Среднее"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Месяцы ===== */
function MonthsView({ months }: { months: MonthlySummary[] }) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  if (months.length === 0) {
    return <EmptyState text="Завершённых месяцев пока нет" />;
  }

  return (
    <div className="space-y-2">
      {months.map((month) => {
        const key = `${month.year}-${month.month}`;
        const isExpanded = expandedMonth === key;

        return (
          <div key={key}>
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : key)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{month.monthName} {month.year}</span>
                <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{month.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>~{Math.round(month.avgCalories)} ккал/д</span>
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && (
              <div className="mt-1 space-y-2">
                {month.weeks.map((w, i) => (
                  <div key={w.weekStart} className="flex justify-between items-center px-3 py-2 text-sm rounded-xl"
                       style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)" }}>
                    <span className="text-white/90 text-xs">{formatWeekRange(w.weekStart, w.weekEnd)}</span>
                    <span className="font-semibold text-white">{Math.round(w.avgCalories)} ккал/д</span>
                  </div>
                ))}
                <SummaryBar
                  calories={month.avgCalories}
                  protein={month.avgProtein}
                  fat={month.avgFat}
                  carbs={month.avgCarbs}
                  norm={month.dailyNorm}
                  label="Среднее"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ===== Общие компоненты ===== */

function SummaryBar({ calories, protein, fat, carbs, norm, label }: {
  calories: number; protein: number; fat: number; carbs: number; norm: number | null; label?: string;
}) {
  const percent = norm ? Math.round((calories / norm) * 100) : null;
  return (
    <div className="glass p-3 space-y-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: "#86CDD9" }}>{label || "Итого"}</span>
        <span className="font-semibold" style={{ color: "#179BB0" }}>{Math.round(calories)} ккал</span>
      </div>
      {norm && (
        <div>
          <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-2 rounded-full transition-all" style={{
              width: `${Math.min(percent || 0, 100)}%`,
              background: (percent || 0) > 100 ? "#ef4444" : "linear-gradient(90deg, #86CDD9, #179BB0)",
            }} />
          </div>
          <div className="text-xs text-right mt-0.5" style={{ color: "rgba(134,205,217,0.4)" }}>{percent}% от нормы</div>
        </div>
      )}
      <div className="flex gap-4 text-xs" style={{ color: "rgba(134,205,217,0.6)" }}>
        <span>Б: <b className="text-white">{Math.round(protein)}г</b></span>
        <span>Ж: <b className="text-white">{Math.round(fat)}г</b></span>
        <span>У: <b className="text-white">{Math.round(carbs)}г</b></span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm" style={{ color: "rgba(134,205,217,0.4)" }}>{text}</p>
    </div>
  );
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Вчера";
  return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
}

function formatWeekRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return `${s.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric" });
}
