"use client";

import { useEffect, useState, useRef } from "react";
import { getHabits, addHabit, deleteHabit } from "@/lib/api";
import { X, Plus, Bot, UserRound } from "lucide-react";

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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return "";
  }
}

export default function HabitsPanel({ isOpen, onClose, refreshTrigger }: HabitsPanelProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Возвращаем фокус на input
      setTimeout(() => inputRef.current?.focus(), 50);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-fade-in rounded-2xl overflow-hidden"
        style={{
          background: "#072a38",
          border: "1px solid rgba(23,155,176,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="font-medium text-white">Мои привычки</span>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "#86CDD9" }}>
            <X size={18} />
          </button>
        </div>

        {/* Список привычек */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2">
          {habits.length === 0 ? (
            <div className="text-center mt-8" style={{ color: "rgba(134,205,217,0.5)" }}>
              <p className="text-sm">Привычек пока нет</p>
              <p className="mt-1 text-xs">Добавьте вручную или ИИ запомнит из контекста</p>
            </div>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="p-3 flex items-start gap-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <div
                  className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: habit.source === "AI" ? "linear-gradient(135deg, #179BB0, #16A085)" : "rgba(255,255,255,0.15)" }}
                  title={habit.source === "AI" ? "Запомнено ИИ" : "Добавлено вручную"}
                >
                  {habit.source === "AI" ? <Bot size={13} color="#fff" /> : <UserRound size={13} color="#86CDD9" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
                    {habit.habitText}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(134,205,217,0.4)" }}>
                    {formatDate(habit.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(habit.id);
                  }}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-red-500/20 transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  title="Удалить"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Форма добавления */}
        <form onSubmit={handleAdd} className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Например: чай = чай + 2 ложки сахара"
              className="input-dark flex-1 text-sm min-w-0"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newHabit.trim()}
              className="btn-primary flex items-center gap-1 px-4 text-sm flex-shrink-0"
            >
              <Plus size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
