"use client";

import { useEffect, useState } from "react";
import { apiRequest, getDailyWater, getDailyMood } from "@/lib/api";
import TableSettings, { TableColumnConfig, getTableConfig, saveTableConfig } from "./TableSettings";
import { Settings, ChevronDown, Droplets, Flame, MessageSquare } from "lucide-react";

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

interface DailyTableProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
  mode?: "inline" | "overlay";
}

export default function DailyTable({ isOpen, onClose, refreshTrigger, mode = "overlay" }: DailyTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [weekDays, setWeekDays] = useState<DailySummary[]>([]);
  const [completedWeeks, setCompletedWeeks] = useState<WeeklySummary[]>([]);
  const [completedMonths, setCompletedMonths] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [columnConfig, setColumnConfig] = useState<TableColumnConfig>(getTableConfig());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, viewMode, refreshTrigger]);

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

  function getTitle() {
    if (viewMode === "daily") return "Текущая неделя";
    if (viewMode === "weekly") {
      const now = new Date();
      return now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    }
    return new Date().getFullYear().toString();
  }

  if (!isOpen) return null;

  // === INLINE MODE (для сайдбара) ===
  if (mode === "inline") {
    return (
      <div className="space-y-3">
        {/* Шапка */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-white">{getTitle()}</span>
          <button onClick={() => setSettingsOpen(true)} className="transition-colors" style={{ color: "rgba(134,205,217,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#86CDD9")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(134,205,217,0.5)")}>
            <Settings size={16} />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className="flex-1 py-1.5 text-xs font-medium rounded-full transition-all"
              style={viewMode === m
                ? { background: "linear-gradient(135deg, #179BB0, #16A085)", color: "#fff" }
                : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(134,205,217,0.7)" }
              }
            >
              {m === "daily" ? "Дни" : m === "weekly" ? "Недели" : "Месяцы"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10" style={{ color: "rgba(134,205,217,0.4)" }}>Загрузка...</div>
        ) : (
          <div className="space-y-3">
            {viewMode === "daily" && <DaysListView days={weekDays} config={columnConfig} />}
            {viewMode === "weekly" && <WeeksListView weeks={completedWeeks} config={columnConfig} />}
            {viewMode === "monthly" && <MonthsListView months={completedMonths} config={columnConfig} />}
          </div>
        )}

        <TableSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} config={columnConfig} onChange={setColumnConfig} />
      </div>
    );
  }

  // === OVERLAY MODE (для мобилки) ===
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in"
           style={{ background: "linear-gradient(180deg, #053545, #140C30)" }}>
        {/* Шапка */}
        <div className="sticky top-0 z-10" style={{ background: "rgba(5,53,69,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="text-xl" style={{ color: "#86CDD9" }}>&times;</button>
            <span className="font-medium text-sm text-white">{getTitle()}</span>
            <button onClick={() => setSettingsOpen(true)} style={{ color: "rgba(134,205,217,0.5)" }}>
              <Settings size={18} />
            </button>
          </div>
          <div className="flex px-4 pb-2 gap-1">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="flex-1 py-1.5 text-xs font-medium rounded-full transition-all"
                style={viewMode === m
                  ? { background: "linear-gradient(135deg, #179BB0, #16A085)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(134,205,217,0.7)" }
                }
              >
                {m === "daily" ? "Дни" : m === "weekly" ? "Недели" : "Месяцы"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center mt-20" style={{ color: "rgba(134,205,217,0.4)" }}>Загрузка...</div>
        ) : (
          <div className="p-4 space-y-3">
            {viewMode === "daily" && <DaysListView days={weekDays} config={columnConfig} />}
            {viewMode === "weekly" && <WeeksListView weeks={completedWeeks} config={columnConfig} />}
            {viewMode === "monthly" && <MonthsListView months={completedMonths} config={columnConfig} />}
          </div>
        )}

        <TableSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} config={columnConfig} onChange={setColumnConfig} />
      </div>
    </div>
  );
}

/* ===== Эмодзи настроения ===== */
function getMoodEmoji(mood: string): string {
  const lower = mood.toLowerCase();
  if (lower.includes("отлич") || lower.includes("супер") || lower.includes("прекрас") || lower.includes("замечат")) return "😄";
  if (lower.includes("хорош") || lower.includes("норм") || lower.includes("неплох")) return "😊";
  if (lower.includes("устал") || lower.includes("сонн") || lower.includes("вял")) return "😴";
  if (lower.includes("грус") || lower.includes("плох") || lower.includes("тоск")) return "😔";
  if (lower.includes("злой") || lower.includes("раздраж") || lower.includes("бес")) return "😤";
  if (lower.includes("стресс") || lower.includes("тревож") || lower.includes("нервн")) return "😰";
  return "😐";
}

/* ===== Утилиты для динамических колонок ===== */
function buildDailyColumns(config: TableColumnConfig) {
  const columns: string[] = ["Блюдо"];
  const colSpans: number[] = [4];
  if (config.weight) { columns.push("Вес"); colSpans.push(2); }
  if (config.calories) { columns.push("Ккал"); colSpans.push(2); }
  if (config.protein) { columns.push("Б"); colSpans.push(1); }
  if (config.fat) { columns.push("Ж"); colSpans.push(1); }
  if (config.carbs) { columns.push("У"); colSpans.push(1); }
  if (config.mood) { columns.push("😊"); colSpans.push(1); }
  return { columns, colSpans, totalCols: colSpans.reduce((a, b) => a + b, 0) };
}

function buildWeeklyColumns(config: TableColumnConfig, nameLabel: string) {
  const columns: string[] = [nameLabel];
  const colSpans: number[] = [4];
  if (config.calories) { columns.push("Ккал"); colSpans.push(3); }
  if (config.protein) { columns.push("Б"); colSpans.push(1); }
  if (config.fat) { columns.push("Ж"); colSpans.push(1); }
  if (config.carbs) { columns.push("У"); colSpans.push(1); }
  return { columns, colSpans, totalCols: colSpans.reduce((a, b) => a + b, 0) };
}

/* ===== Вид "Дни" ===== */
function DaysListView({ days, config }: { days: DailySummary[]; config: TableColumnConfig }) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [waterByDate, setWaterByDate] = useState<Record<string, number>>({});
  const [moodByDate, setMoodByDate] = useState<Record<string, string>>({});

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
    async function loadMoods() {
      const moods: Record<string, string> = {};
      for (const day of days) {
        try {
          const data = await getDailyMood(day.date);
          if (data.mood) moods[day.date] = data.mood;
        } catch { /* ошибка */ }
      }
      setMoodByDate(moods);
    }
    if (days.length > 0) {
      loadWater();
      loadMoods();
    }
  }, [days]);

  if (days.length === 0) {
    return <EmptyState text="Напиши в чат что ты ел — данные появятся здесь" />;
  }

  const today = new Date().toISOString().split("T")[0];

  function formatDayLabel(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((todayDate.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Вчера";
    return d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <>
      {days.map((day) => {
        const isExpanded = expandedDate === day.date || (expandedDate === null && day.date === today);
        const hasEntries = day.entries.length > 0;
        const normPercent = day.dailyNorm ? Math.round((day.totalCalories / day.dailyNorm) * 100) : null;

        return (
          <div key={day.date} className="space-y-2">
            <button
              onClick={() => setExpandedDate(isExpanded ? "__none__" : day.date)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{formatDayLabel(day.date)}</span>
                {hasEntries && (
                  <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{day.entries.length} записей</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasEntries && (
                  <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>{Math.round(day.totalCalories)} ккал</span>
                )}
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && hasEntries && (() => {
              const { columns, colSpans, totalCols } = buildDailyColumns(config);
              return (
              <div className="space-y-2 pl-1">
                <div className="glass overflow-hidden">
                  <TableHeader columns={columns} colSpans={colSpans} />
                  {day.entries.map((e, i) => (
                    <div key={e.id} className="grid gap-1 px-3 py-2.5 text-sm items-center"
                         style={{
                           gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
                           background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                         }}>
                      <div style={{ gridColumn: "span 4" }} className="font-medium text-white/90 truncate" title={e.foodName}>{e.foodName}</div>
                      {config.weight && <div style={{ gridColumn: "span 2", color: "#86CDD9" }} className="text-center text-xs">{e.weight ? `${Math.round(e.weight)}г` : "—"}</div>}
                      {config.calories && <div style={{ gridColumn: "span 2" }} className="text-center font-semibold text-white">{Math.round(e.calories)}</div>}
                      {config.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{e.protein != null ? Math.round(e.protein) : "—"}</div>}
                      {config.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{e.fat != null ? Math.round(e.fat) : "—"}</div>}
                      {config.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{e.carbs != null ? Math.round(e.carbs) : "—"}</div>}
                      {config.mood && <div style={{ gridColumn: "span 1" }} className="text-center text-xs" title={moodByDate[day.date] || ""}>{moodByDate[day.date] ? getMoodEmoji(moodByDate[day.date]) : "—"}</div>}
                    </div>
                  ))}
                  <TotalRow calories={day.totalCalories} protein={day.totalProtein} fat={day.totalFat} carbs={day.totalCarbs} label="Итого" config={config} />
                </div>
                <NormBar current={day.totalCalories} norm={day.dailyNorm} percent={normPercent} />
                {waterByDate[day.date] > 0 && (
                  <div className="glass p-3 flex items-center gap-2">
                    <Droplets size={14} style={{ color: "#179BB0" }} />
                    <span className="text-sm text-white font-medium">{waterByDate[day.date]} мл</span>
                    <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>/ 2000 мл</span>
                  </div>
                )}
                <AiComment comment={day.aiComment} />
                <MacroCard protein={day.totalProtein} fat={day.totalFat} carbs={day.totalCarbs} />
              </div>
              );
            })()}

            {isExpanded && !hasEntries && (
              <div className="text-center text-sm py-4" style={{ color: "rgba(134,205,217,0.4)" }}>Нет записей за этот день</div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ===== Вид "Недели" ===== */
function WeeksListView({ weeks, config }: { weeks: WeeklySummary[]; config: TableColumnConfig }) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  if (weeks.length === 0) {
    return <EmptyState text="Завершённых недель пока нет — данные появятся в конце недели" />;
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

  return (
    <>
      {weeks.map((week) => {
        const isExpanded = expandedWeek === week.weekStart;

        return (
          <div key={week.weekStart} className="space-y-2">
            <button
              onClick={() => setExpandedWeek(isExpanded ? null : week.weekStart)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{formatWeekRange(week.weekStart, week.weekEnd)}</span>
                <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{week.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>~{Math.round(week.avgCalories)} ккал/д</span>
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && (() => {
              const { columns, colSpans, totalCols } = buildWeeklyColumns(config, "День");
              return (
              <div className="space-y-2 pl-1">
                <div className="glass overflow-hidden">
                  <TableHeader columns={columns} colSpans={colSpans} />
                  {week.days.map((d, i) => (
                    <div key={d.date} className="grid gap-1 px-3 py-2.5 text-sm items-center"
                         style={{
                           gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
                           background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                         }}>
                      <div style={{ gridColumn: "span 4" }} className="font-medium text-white/90">{formatShortDate(d.date)}</div>
                      {config.calories && <div style={{ gridColumn: "span 3" }} className="text-center font-semibold text-white">{Math.round(d.totalCalories)}</div>}
                      {config.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(d.totalProtein)}</div>}
                      {config.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(d.totalFat)}</div>}
                      {config.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(d.totalCarbs)}</div>}
                    </div>
                  ))}
                  <TotalRow calories={week.avgCalories} protein={week.avgProtein} fat={week.avgFat} carbs={week.avgCarbs} label="Среднее" config={config} colLayout="weekly" />
                  {week.dailyNorm && <NormRow norm={week.dailyNorm} config={config} colLayout="weekly" />}
                </div>
                <NormBar current={week.avgCalories} norm={week.dailyNorm} percent={week.dailyNorm ? Math.round((week.avgCalories / week.dailyNorm) * 100) : null} label="Среднее vs норма" />
                <AiComment comment={week.aiComment} />
                <MacroCard protein={week.avgProtein} fat={week.avgFat} carbs={week.avgCarbs} label="Среднее за день" />
                <div className="text-xs text-center" style={{ color: "rgba(134,205,217,0.3)" }}>Дней с данными: {week.daysWithData} из 7</div>
              </div>
              );
            })()}
          </div>
        );
      })}
    </>
  );
}

/* ===== Вид "Месяцы" ===== */
function MonthsListView({ months, config }: { months: MonthlySummary[]; config: TableColumnConfig }) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  if (months.length === 0) {
    return <EmptyState text="Завершённых месяцев пока нет — данные появятся в следующем месяце" />;
  }

  function formatWeekRange(start: string, end: string) {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return `${s.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
  }

  return (
    <>
      {months.map((month) => {
        const key = `${month.year}-${month.month}`;
        const isExpanded = expandedMonth === key;

        return (
          <div key={key} className="space-y-2">
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : key)}
              className="w-full glass glass-hover p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{month.monthName} {month.year}</span>
                <span className="text-xs" style={{ color: "rgba(134,205,217,0.4)" }}>{month.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#179BB0" }}>~{Math.round(month.avgCalories)} ккал/д</span>
                <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} style={{ color: "rgba(134,205,217,0.4)" }} />
              </div>
            </button>

            {isExpanded && (() => {
              const { columns, colSpans, totalCols } = buildWeeklyColumns(config, "Неделя");
              return (
              <div className="space-y-2 pl-1">
                <div className="glass overflow-hidden">
                  <TableHeader columns={columns} colSpans={colSpans} />
                  {month.weeks.map((w, i) => (
                    <div key={w.weekStart} className="grid gap-1 px-3 py-2.5 text-sm items-center"
                         style={{
                           gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))`,
                           background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                         }}>
                      <div style={{ gridColumn: "span 4" }} className="font-medium text-white/90 text-xs">{formatWeekRange(w.weekStart, w.weekEnd)}</div>
                      {config.calories && <div style={{ gridColumn: "span 3" }} className="text-center font-semibold text-white">{Math.round(w.avgCalories)}</div>}
                      {config.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(w.avgProtein)}</div>}
                      {config.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(w.avgFat)}</div>}
                      {config.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(w.avgCarbs)}</div>}
                    </div>
                  ))}
                  <TotalRow calories={month.avgCalories} protein={month.avgProtein} fat={month.avgFat} carbs={month.avgCarbs} label="Среднее" config={config} colLayout="weekly" />
                  {month.dailyNorm && <NormRow norm={month.dailyNorm} config={config} colLayout="weekly" />}
                </div>
                <NormBar current={month.avgCalories} norm={month.dailyNorm} percent={month.dailyNorm ? Math.round((month.avgCalories / month.dailyNorm) * 100) : null} label="Среднее vs норма" />
                <AiComment comment={month.aiComment} />
                <MacroCard protein={month.avgProtein} fat={month.avgFat} carbs={month.avgCarbs} label="Среднее за день" />
                <div className="text-xs text-center" style={{ color: "rgba(134,205,217,0.3)" }}>Дней с данными: {month.daysWithData}</div>
              </div>
              );
            })()}
          </div>
        );
      })}
    </>
  );
}

/* ===== Переиспользуемые компоненты ===== */

function TableHeader({ columns, colSpans }: { columns: string[]; colSpans: number[] }) {
  const totalCols = colSpans.reduce((a, b) => a + b, 0);
  return (
    <div className="grid gap-1 px-3 py-2 text-xs font-semibold text-white"
         style={{ background: "linear-gradient(135deg, #179BB0, #16A085)", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
      {columns.map((col, i) => (
        <div key={col} className={`text-${i === 0 ? "left" : "center"}`} style={{ gridColumn: `span ${colSpans[i]}` }}>{col}</div>
      ))}
    </div>
  );
}

function TotalRow({ calories, protein, fat, carbs, label, colLayout, config }: { calories: number; protein: number; fat: number; carbs: number; label: string; colLayout?: string; config?: TableColumnConfig }) {
  const c = config || { weight: true, calories: true, protein: true, fat: true, carbs: true, mood: false };
  if (colLayout === "weekly") {
    const { totalCols } = buildWeeklyColumns(c, "");
    return (
      <div className="grid gap-1 px-3 py-3 text-sm font-bold" style={{ borderTop: "2px solid #179BB0", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
        <div style={{ gridColumn: "span 4" }} className="text-white">{label}</div>
        {c.calories && <div style={{ gridColumn: "span 3", color: "#179BB0" }} className="text-center">{Math.round(calories)}</div>}
        {c.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(protein)}</div>}
        {c.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(fat)}</div>}
        {c.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(carbs)}</div>}
      </div>
    );
  }
  const { totalCols } = buildDailyColumns(c);
  return (
    <div className="grid gap-1 px-3 py-3 text-sm font-bold" style={{ borderTop: "2px solid #179BB0", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
      <div style={{ gridColumn: "span 4" }} className="text-white">{label}</div>
      {c.weight && <div style={{ gridColumn: "span 2" }} />}
      {c.calories && <div style={{ gridColumn: "span 2", color: "#179BB0" }} className="text-center">{Math.round(calories)}</div>}
      {c.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(protein)}</div>}
      {c.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(fat)}</div>}
      {c.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.6)" }} className="text-center text-xs">{Math.round(carbs)}</div>}
      {c.mood && <div style={{ gridColumn: "span 1" }} />}
    </div>
  );
}

function NormRow({ norm, colLayout, config }: { norm: number; colLayout?: string; config?: TableColumnConfig }) {
  const c = config || { weight: true, calories: true, protein: true, fat: true, carbs: true, mood: false };
  if (colLayout === "weekly") {
    const { totalCols } = buildWeeklyColumns(c, "");
    return (
      <div className="grid gap-1 px-3 py-2 text-sm items-center" style={{ background: "rgba(22,160,133,0.08)", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
        <div style={{ gridColumn: "span 4", color: "rgba(134,205,217,0.5)" }} className="italic">Ожидаемое</div>
        {c.calories && <div style={{ gridColumn: "span 3", color: "rgba(134,205,217,0.5)" }} className="text-center italic">{Math.round(norm)}</div>}
        {c.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
        {c.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
        {c.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
      </div>
    );
  }
  const { totalCols } = buildDailyColumns(c);
  return (
    <div className="grid gap-1 px-3 py-2 text-sm items-center" style={{ background: "rgba(22,160,133,0.08)", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
      <div style={{ gridColumn: "span 4", color: "rgba(134,205,217,0.5)" }} className="italic">Ожидаемое</div>
      {c.weight && <div style={{ gridColumn: "span 2" }} />}
      {c.calories && <div style={{ gridColumn: "span 2", color: "rgba(134,205,217,0.5)" }} className="text-center italic">{Math.round(norm)}</div>}
      {c.protein && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
      {c.fat && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
      {c.carbs && <div style={{ gridColumn: "span 1", color: "rgba(134,205,217,0.3)" }} className="text-center text-xs">—</div>}
      {c.mood && <div style={{ gridColumn: "span 1" }} />}
    </div>
  );
}

function NormBar({ current, norm, percent, label }: { current: number; norm: number | null; percent: number | null; label?: string }) {
  if (!norm) return null;
  return (
    <div className="glass p-4">
      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: "#86CDD9" }}>{label || "Дневная норма"}</span>
        <span className="font-semibold" style={{ color: "#179BB0" }}>{Math.round(current)} / {Math.round(norm)} ккал</span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-3 rounded-full transition-all duration-500" style={{
          width: `${Math.min(percent || 0, 100)}%`,
          background: (percent || 0) > 100 ? "#ef4444" : "linear-gradient(90deg, #86CDD9, #179BB0)",
        }} />
      </div>
      <div className="text-xs mt-1 text-right" style={{ color: "rgba(134,205,217,0.4)" }}>{percent}%</div>
    </div>
  );
}

function MacroCard({ protein, fat, carbs, label }: { protein: number; fat: number; carbs: number; label?: string }) {
  return (
    <div className="glass p-4">
      <p className="text-sm mb-3" style={{ color: "#86CDD9" }}>{label || "Макронутриенты"}</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-bold" style={{ color: "#179BB0" }}>{Math.round(protein)}г</div>
          <div className="text-xs" style={{ color: "rgba(134,205,217,0.5)" }}>Белки</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#16A085" }}>{Math.round(fat)}г</div>
          <div className="text-xs" style={{ color: "rgba(134,205,217,0.5)" }}>Жиры</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#86CDD9" }}>{Math.round(carbs)}г</div>
          <div className="text-xs" style={{ color: "rgba(134,205,217,0.5)" }}>Углеводы</div>
        </div>
      </div>
    </div>
  );
}

function AiComment({ comment }: { comment: string | null }) {
  if (!comment) return null;
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={13} style={{ color: "#16A085" }} />
        <p className="text-sm" style={{ color: "#86CDD9" }}>Комментарий</p>
      </div>
      <p className="text-sm text-white/80">{comment}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center mt-12 px-4">
      <p className="text-base mb-2" style={{ color: "rgba(134,205,217,0.4)" }}>Нет записей</p>
      <p className="text-sm" style={{ color: "rgba(134,205,217,0.3)" }}>{text}</p>
    </div>
  );
}
