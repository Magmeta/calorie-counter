"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

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
}

interface DailyTableProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
}

export default function DailyTable({ isOpen, onClose, refreshTrigger }: DailyTableProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen, selectedDate, refreshTrigger]);

  async function loadSummary() {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/meals/daily?date=${selectedDate}`);
      setSummary(data);
    } catch {
      // ошибка загрузки
    } finally {
      setLoading(false);
    }
  }

  function changeDate(offset: number) {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split("T")[0]);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - date.getTime()) / 86400000);

    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Вчера";

    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
  }

  if (!isOpen) return null;

  const normPercent = summary?.dailyNorm && summary.totalCalories
    ? Math.round((summary.totalCalories / summary.dailyNorm) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Затемнение */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Панель */}
      <div className="relative w-full max-w-md bg-gray-50 h-full overflow-y-auto shadow-2xl animate-slide-in">
        {/* Шапка */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg">
            &times;
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => changeDate(-1)} className="px-2 py-1 text-gray-500 hover:text-gray-700">&larr;</button>
            <span className="font-medium text-sm">{formatDate(selectedDate)}</span>
            <button onClick={() => changeDate(1)} className="px-2 py-1 text-gray-500 hover:text-gray-700">&rarr;</button>
          </div>
          <div className="w-5" />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 mt-20">Загрузка...</div>
        ) : !summary || summary.entries.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 px-4">
            <p className="text-lg mb-2">Нет записей</p>
            <p className="text-sm">Напиши в чат что ты ел — данные появятся здесь</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Таблица */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Заголовки колонок */}
              <div className="grid grid-cols-12 gap-1 px-3 py-2 text-xs font-semibold text-white"
                   style={{ background: "linear-gradient(135deg, #179BB0, #15565B)" }}>
                <div className="col-span-4">Блюдо</div>
                <div className="col-span-2 text-center">Вес</div>
                <div className="col-span-2 text-center">Ккал</div>
                <div className="col-span-1 text-center">Б</div>
                <div className="col-span-1 text-center">Ж</div>
                <div className="col-span-1 text-center">У</div>
                <div className="col-span-1" />
              </div>

              {/* Строки */}
              {summary.entries.map((entry, i) => (
                <div key={entry.id}
                     className={`grid grid-cols-12 gap-1 px-3 py-2.5 text-sm items-center ${
                       i % 2 === 0 ? "bg-white" : "bg-gray-50"
                     }`}>
                  <div className="col-span-4 font-medium text-gray-800 truncate" title={entry.foodName}>
                    {entry.foodName}
                  </div>
                  <div className="col-span-2 text-center text-gray-500">
                    {entry.weight ? `${Math.round(entry.weight)}г` : "—"}
                  </div>
                  <div className="col-span-2 text-center font-semibold text-gray-700">
                    {Math.round(entry.calories)}
                  </div>
                  <div className="col-span-1 text-center text-gray-500 text-xs">
                    {entry.protein != null ? Math.round(entry.protein) : "—"}
                  </div>
                  <div className="col-span-1 text-center text-gray-500 text-xs">
                    {entry.fat != null ? Math.round(entry.fat) : "—"}
                  </div>
                  <div className="col-span-1 text-center text-gray-500 text-xs">
                    {entry.carbs != null ? Math.round(entry.carbs) : "—"}
                  </div>
                  <div className="col-span-1" />
                </div>
              ))}

              {/* Итого */}
              <div className="grid grid-cols-12 gap-1 px-3 py-3 text-sm font-bold border-t-2"
                   style={{ borderColor: "#179BB0" }}>
                <div className="col-span-4 text-gray-800">Итого</div>
                <div className="col-span-2" />
                <div className="col-span-2 text-center" style={{ color: "#15565B" }}>
                  {Math.round(summary.totalCalories)}
                </div>
                <div className="col-span-1 text-center text-gray-600 text-xs">
                  {Math.round(summary.totalProtein)}
                </div>
                <div className="col-span-1 text-center text-gray-600 text-xs">
                  {Math.round(summary.totalFat)}
                </div>
                <div className="col-span-1 text-center text-gray-600 text-xs">
                  {Math.round(summary.totalCarbs)}
                </div>
                <div className="col-span-1" />
              </div>
            </div>

            {/* Прогресс-бар нормы */}
            {summary.dailyNorm && (
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Дневная норма</span>
                  <span className="font-semibold" style={{ color: "#15565B" }}>
                    {Math.round(summary.totalCalories)} / {Math.round(summary.dailyNorm)} ккал
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(normPercent || 0, 100)}%`,
                      background: (normPercent || 0) > 100
                        ? "#ef4444"
                        : "linear-gradient(90deg, #86CDD9, #179BB0)",
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {normPercent}%
                </div>
              </div>
            )}

            {/* БЖУ распределение */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-3">Макронутриенты</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold" style={{ color: "#179BB0" }}>
                    {Math.round(summary.totalProtein)}г
                  </div>
                  <div className="text-xs text-gray-400">Белки</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "#15565B" }}>
                    {Math.round(summary.totalFat)}г
                  </div>
                  <div className="text-xs text-gray-400">Жиры</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: "#86CDD9" }}>
                    {Math.round(summary.totalCarbs)}г
                  </div>
                  <div className="text-xs text-gray-400">Углеводы</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
