"use client";

import { useEffect, useState } from "react";
import { apiRequest, getDailyWater } from "@/lib/api";

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
}

export default function DailyTable({ isOpen, onClose, refreshTrigger }: DailyTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [weekDays, setWeekDays] = useState<DailySummary[]>([]);
  const [completedWeeks, setCompletedWeeks] = useState<WeeklySummary[]>([]);
  const [completedMonths, setCompletedMonths] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-50 h-full overflow-y-auto shadow-2xl animate-slide-in">
        {/* Шапка */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            <span className="font-medium text-sm">{getTitle()}</span>
            <div className="w-6" />
          </div>
          {/* Вкладки */}
          <div className="flex px-4 pb-2 gap-1">
            {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  viewMode === mode
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={viewMode === mode ? { background: "linear-gradient(135deg, #179BB0, #15565B)" } : {}}
              >
                {mode === "daily" ? "Дни" : mode === "weekly" ? "Недели" : "Месяцы"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 mt-20">Загрузка...</div>
        ) : (
          <div className="p-4 space-y-3">
            {viewMode === "daily" && <DaysListView days={weekDays} />}
            {viewMode === "weekly" && <WeeksListView weeks={completedWeeks} />}
            {viewMode === "monthly" && <MonthsListView months={completedMonths} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Вид "Дни" — дни текущей незавершённой недели (аккордеон) ===== */
function DaysListView({ days }: { days: DailySummary[] }) {
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
    return <EmptyState text="Напиши в чат что ты ел — данные появятся здесь" />;
  }

  // Автоматически раскрываем сегодня
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
            {/* Заголовок дня — кликабельный */}
            <button
              onClick={() => setExpandedDate(isExpanded ? "__none__" : day.date)}
              className="w-full bg-white rounded-2xl shadow-sm p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{formatDayLabel(day.date)}</span>
                {hasEntries && (
                  <span className="text-xs text-gray-400">{day.entries.length} записей</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasEntries && (
                  <span className="text-sm font-semibold" style={{ color: "#15565B" }}>{Math.round(day.totalCalories)} ккал</span>
                )}
                <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>&#9660;</span>
              </div>
            </button>

            {/* Развёрнутое содержимое дня */}
            {isExpanded && hasEntries && (
              <div className="space-y-2 pl-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <TableHeader columns={["Блюдо", "Вес", "Ккал", "Б", "Ж", "У"]} colSpans={[4, 2, 2, 1, 1, 1]} />
                  {day.entries.map((e, i) => (
                    <div key={e.id} className={`grid grid-cols-11 gap-1 px-3 py-2.5 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <div className="col-span-4 font-medium text-gray-800 truncate" title={e.foodName}>{e.foodName}</div>
                      <div className="col-span-2 text-center text-gray-500">{e.weight ? `${Math.round(e.weight)}г` : "—"}</div>
                      <div className="col-span-2 text-center font-semibold text-gray-700">{Math.round(e.calories)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{e.protein != null ? Math.round(e.protein) : "—"}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{e.fat != null ? Math.round(e.fat) : "—"}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{e.carbs != null ? Math.round(e.carbs) : "—"}</div>
                    </div>
                  ))}
                  <TotalRow calories={day.totalCalories} protein={day.totalProtein} fat={day.totalFat} carbs={day.totalCarbs} label="Итого" />
                </div>
                <NormBar current={day.totalCalories} norm={day.dailyNorm} percent={normPercent} />
                {waterByDate[day.date] > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-2">
                    <span className="text-sm">💧</span>
                    <span className="text-sm text-gray-700 font-medium">{waterByDate[day.date]} мл</span>
                    <span className="text-xs text-gray-400">/ 2000 мл</span>
                  </div>
                )}
                <AiComment comment={day.aiComment} />
                <MacroCard protein={day.totalProtein} fat={day.totalFat} carbs={day.totalCarbs} />
              </div>
            )}

            {isExpanded && !hasEntries && (
              <div className="text-center text-gray-400 text-sm py-4">Нет записей за этот день</div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ===== Вид "Недели" — завершённые недели текущего месяца ===== */
function WeeksListView({ weeks }: { weeks: WeeklySummary[] }) {
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
              className="w-full bg-white rounded-2xl shadow-sm p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{formatWeekRange(week.weekStart, week.weekEnd)}</span>
                <span className="text-xs text-gray-400">{week.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#15565B" }}>~{Math.round(week.avgCalories)} ккал/д</span>
                <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>&#9660;</span>
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-2 pl-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <TableHeader columns={["День", "Ккал", "Б", "Ж", "У"]} colSpans={[4, 3, 1, 1, 1]} />
                  {week.days.map((d, i) => (
                    <div key={d.date} className={`grid grid-cols-10 gap-1 px-3 py-2.5 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <div className="col-span-4 font-medium text-gray-800">{formatShortDate(d.date)}</div>
                      <div className="col-span-3 text-center font-semibold text-gray-700">{Math.round(d.totalCalories)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(d.totalProtein)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(d.totalFat)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(d.totalCarbs)}</div>
                    </div>
                  ))}
                  <TotalRow calories={week.avgCalories} protein={week.avgProtein} fat={week.avgFat} carbs={week.avgCarbs} label="Среднее" colLayout="weekly" />
                  {week.dailyNorm && <NormRow norm={week.dailyNorm} colLayout="weekly" />}
                </div>
                <NormBar current={week.avgCalories} norm={week.dailyNorm} percent={week.dailyNorm ? Math.round((week.avgCalories / week.dailyNorm) * 100) : null} label="Среднее vs норма" />
                <AiComment comment={week.aiComment} />
                <MacroCard protein={week.avgProtein} fat={week.avgFat} carbs={week.avgCarbs} label="Среднее за день" />
                <div className="text-xs text-gray-400 text-center">Дней с данными: {week.daysWithData} из 7</div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ===== Вид "Месяцы" — завершённые месяцы ===== */
function MonthsListView({ months }: { months: MonthlySummary[] }) {
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
              className="w-full bg-white rounded-2xl shadow-sm p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{month.monthName} {month.year}</span>
                <span className="text-xs text-gray-400">{month.daysWithData} дн.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#15565B" }}>~{Math.round(month.avgCalories)} ккал/д</span>
                <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>&#9660;</span>
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-2 pl-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <TableHeader columns={["Неделя", "Ккал", "Б", "Ж", "У"]} colSpans={[4, 3, 1, 1, 1]} />
                  {month.weeks.map((w, i) => (
                    <div key={w.weekStart} className={`grid grid-cols-10 gap-1 px-3 py-2.5 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <div className="col-span-4 font-medium text-gray-800 text-xs">{formatWeekRange(w.weekStart, w.weekEnd)}</div>
                      <div className="col-span-3 text-center font-semibold text-gray-700">{Math.round(w.avgCalories)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(w.avgProtein)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(w.avgFat)}</div>
                      <div className="col-span-1 text-center text-gray-500 text-xs">{Math.round(w.avgCarbs)}</div>
                    </div>
                  ))}
                  <TotalRow calories={month.avgCalories} protein={month.avgProtein} fat={month.avgFat} carbs={month.avgCarbs} label="Среднее" colLayout="weekly" />
                  {month.dailyNorm && <NormRow norm={month.dailyNorm} colLayout="weekly" />}
                </div>
                <NormBar current={month.avgCalories} norm={month.dailyNorm} percent={month.dailyNorm ? Math.round((month.avgCalories / month.dailyNorm) * 100) : null} label="Среднее vs норма" />
                <AiComment comment={month.aiComment} />
                <MacroCard protein={month.avgProtein} fat={month.avgFat} carbs={month.avgCarbs} label="Среднее за день" />
                <div className="text-xs text-gray-400 text-center">Дней с данными: {month.daysWithData}</div>
              </div>
            )}
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
    <div className={`grid gap-1 px-3 py-2 text-xs font-semibold text-white`}
         style={{ background: "linear-gradient(135deg, #179BB0, #15565B)", gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}>
      {columns.map((col, i) => (
        <div key={col} className={`text-${i === 0 ? "left" : "center"}`} style={{ gridColumn: `span ${colSpans[i]}` }}>{col}</div>
      ))}
    </div>
  );
}

function TotalRow({ calories, protein, fat, carbs, label, colLayout }: { calories: number; protein: number; fat: number; carbs: number; label: string; colLayout?: string }) {
  if (colLayout === "weekly") {
    return (
      <div className="grid grid-cols-10 gap-1 px-3 py-3 text-sm font-bold border-t-2" style={{ borderColor: "#179BB0" }}>
        <div className="col-span-4 text-gray-800">{label}</div>
        <div className="col-span-3 text-center" style={{ color: "#15565B" }}>{Math.round(calories)}</div>
        <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(protein)}</div>
        <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(fat)}</div>
        <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(carbs)}</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-11 gap-1 px-3 py-3 text-sm font-bold border-t-2" style={{ borderColor: "#179BB0" }}>
      <div className="col-span-4 text-gray-800">{label}</div>
      <div className="col-span-2" />
      <div className="col-span-2 text-center" style={{ color: "#15565B" }}>{Math.round(calories)}</div>
      <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(protein)}</div>
      <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(fat)}</div>
      <div className="col-span-1 text-center text-gray-600 text-xs">{Math.round(carbs)}</div>
    </div>
  );
}

function NormRow({ norm, colLayout }: { norm: number; colLayout?: string }) {
  if (colLayout === "weekly") {
    return (
      <div className="grid grid-cols-10 gap-1 px-3 py-2 text-sm items-center bg-teal-50/50">
        <div className="col-span-4 text-gray-500 italic">Ожидаемое</div>
        <div className="col-span-3 text-center text-gray-500 italic">{Math.round(norm)}</div>
        <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
        <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
        <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-11 gap-1 px-3 py-2 text-sm items-center bg-teal-50/50">
      <div className="col-span-4 text-gray-500 italic">Ожидаемое</div>
      <div className="col-span-2" />
      <div className="col-span-2 text-center text-gray-500 italic">{Math.round(norm)}</div>
      <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
      <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
      <div className="col-span-1 text-center text-gray-400 text-xs">—</div>
    </div>
  );
}

function NormBar({ current, norm, percent, label }: { current: number; norm: number | null; percent: number | null; label?: string }) {
  if (!norm) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">{label || "Дневная норма"}</span>
        <span className="font-semibold" style={{ color: "#15565B" }}>{Math.round(current)} / {Math.round(norm)} ккал</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-500" style={{
          width: `${Math.min(percent || 0, 100)}%`,
          background: (percent || 0) > 100 ? "#ef4444" : "linear-gradient(90deg, #86CDD9, #179BB0)",
        }} />
      </div>
      <div className="text-xs text-gray-400 mt-1 text-right">{percent}%</div>
    </div>
  );
}

function MacroCard({ protein, fat, carbs, label }: { protein: number; fat: number; carbs: number; label?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm text-gray-600 mb-3">{label || "Макронутриенты"}</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-lg font-bold" style={{ color: "#179BB0" }}>{Math.round(protein)}г</div>
          <div className="text-xs text-gray-400">Белки</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#15565B" }}>{Math.round(fat)}г</div>
          <div className="text-xs text-gray-400">Жиры</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: "#86CDD9" }}>{Math.round(carbs)}г</div>
          <div className="text-xs text-gray-400">Углеводы</div>
        </div>
      </div>
    </div>
  );
}

function AiComment({ comment }: { comment: string | null }) {
  if (!comment) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm text-gray-600 mb-1">Комментарий</p>
      <p className="text-sm text-gray-800">{comment}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center text-gray-400 mt-16 px-4">
      <p className="text-lg mb-2">Нет записей</p>
      <p className="text-sm">{text}</p>
    </div>
  );
}
