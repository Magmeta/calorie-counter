"use client";

import { useEffect, useState } from "react";
import { getHabits, addHabit, deleteHabit } from "@/lib/api";

interface Habit {
  id: number;
  habitText: string;
  source: "AI" | "USER";
  createdAt: string;
}

interface HabitsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

export default function HabitsPanel({ isOpen, onClose, refreshTrigger }: HabitsPanelProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadHabits();
  }, [isOpen, refreshTrigger]);

  async function loadHabits() {
    try {
      const data = await getHabits();
      setHabits(data);
    } catch {
      // пусто
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabit.trim() || loading) return;

    setLoading(true);
    try {
      await addHabit(newHabit.trim());
      setNewHabit("");
      await loadHabits();
    } catch {
      // ошибка
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch {
      // ошибка
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-50 h-full overflow-y-auto shadow-2xl animate-slide-in flex flex-col">
        {/* Шапка */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            <span className="font-medium text-sm">Мои привычки</span>
            <div className="w-6" />
          </div>
        </div>

        {/* Список привычек */}
        <div className="flex-1 p-4 space-y-2">
          {habits.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm">
              <p>Привычек пока нет</p>
              <p className="mt-1 text-xs">Добавьте вручную или ИИ запомнит из контекста</p>
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="bg-white rounded-2xl shadow-sm p-3 flex items-start gap-3"
              >
                <div
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: habit.source === "AI" ? "linear-gradient(135deg, #179BB0, #15565B)" : "#6B7280" }}
                  title={habit.source === "AI" ? "Запомнено ИИ" : "Добавлено вручную"}
                >
                  {habit.source === "AI" ? "A" : "U"}
                </div>
                <p className="flex-1 text-sm text-gray-800">{habit.habitText}</p>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                  title="Удалить"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>

        {/* Форма добавления */}
        <form onSubmit={handleAdd} className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Например: чай = чай + 2 ложки сахара"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newHabit.trim()}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #179BB0, #15565B)" }}
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
