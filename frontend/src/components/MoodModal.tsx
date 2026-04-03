"use client";

import { useState } from "react";
import { setDailyMood } from "@/lib/api";
import { X } from "lucide-react";

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOODS = [
  { value: "ANGRY", emoji: "\uD83D\uDE21", label: "Ужасное" },
  { value: "SAD", emoji: "\uD83D\uDE1E", label: "Плохое" },
  { value: "NEUTRAL", emoji: "\uD83D\uDE10", label: "Нормальное" },
  { value: "GOOD", emoji: "\uD83D\uDE0A", label: "Хорошее" },
  { value: "HAPPY", emoji: "\uD83D\uDE04", label: "Отличное" },
];

export default function MoodModal({ isOpen, onClose }: MoodModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleMoodSelect(mood: string) {
    if (loading) return;
    setLoading(true);
    try {
      await setDailyMood(mood);
      onClose();
    } catch {
      // ошибка — просто закрываем
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-sm mx-4 overflow-hidden rounded-2xl animate-fade-in"
        style={{
          background: "#0a3d4f",
          border: "1px solid rgba(23,155,176,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Как настроение сегодня?</span>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "#86CDD9" }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-5">
          <div className="flex justify-between gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={loading}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all flex-1 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(23,155,176,0.2)";
                  e.currentTarget.style.borderColor = "#179BB0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-[10px]" style={{ color: "rgba(134,205,217,0.7)" }}>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
