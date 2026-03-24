"use client";

import { useEffect, useState } from "react";
import { addWater, getDailyWater } from "@/lib/api";
import { Droplets, X, Check } from "lucide-react";

interface WaterEntry {
  id: number;
  amount: number;
  entryDate: string;
  createdAt: string;
}

interface WaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "modal" | "popup";
}

const QUICK_AMOUNTS = [250, 330, 500, 1000];

export default function WaterModal({ isOpen, onClose, mode = "modal" }: WaterModalProps) {
  const [amount, setAmount] = useState("");
  const [selectedMl, setSelectedMl] = useState<number | null>(null);
  const [totalMl, setTotalMl] = useState(0);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadDailyWater();
  }, [isOpen]);

  async function loadDailyWater() {
    try {
      const data = await getDailyWater();
      setTotalMl(data.totalMl);
      setEntries(data.entries);
    } catch {
      // ошибка
    }
  }

  async function handleAdd(ml: number) {
    if (loading || ml <= 0) return;
    setLoading(true);
    try {
      await addWater(ml);
      setAmount("");
      setSelectedMl(null);
      await loadDailyWater();
    } catch {
      // ошибка
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (selectedMl) {
      await handleAdd(selectedMl);
    } else if (amount && parseInt(amount) > 0) {
      await handleAdd(parseInt(amount));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ml = parseInt(amount);
    if (isNaN(ml) || ml <= 0) return;
    await handleAdd(ml);
  }

  if (!isOpen) return null;

  const waterNorm = 2000;
  const percentage = Math.min(Math.round((totalMl / waterNorm) * 100), 100);

  const content = (
    <div className="space-y-4">
      {/* Итого за день */}
      <div className="text-center">
        <div className="text-3xl font-bold" style={{ color: "#179BB0" }}>
          {totalMl} мл
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(134,205,217,0.7)" }}>
          из {waterNorm} мл ({percentage}%)
        </div>
        <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: "linear-gradient(135deg, #179BB0, #86CDD9)",
            }}
          />
        </div>
      </div>

      {/* Быстрые кнопки */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map((ml) => (
          <button
            key={ml}
            onClick={() => { setSelectedMl(ml); setAmount(""); }}
            disabled={loading}
            className="py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: selectedMl === ml ? "rgba(23,155,176,0.3)" : "rgba(255,255,255,0.1)",
              border: selectedMl === ml ? "2px solid #179BB0" : "1px solid rgba(255,255,255,0.2)",
              color: selectedMl === ml ? "#fff" : "#86CDD9",
            }}
          >
            {ml >= 1000 ? `${ml / 1000}л` : `${ml}мл`}
          </button>
        ))}
      </div>

      {/* Произвольное количество */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setSelectedMl(null); }}
          placeholder="Другое количество (мл)"
          min="1"
          className="input-dark flex-1 text-sm"
          disabled={loading}
        />
      </form>

      {/* Кнопка подтверждения */}
      <button
        onClick={handleConfirm}
        disabled={loading || (!selectedMl && (!amount || parseInt(amount) <= 0))}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
      >
        <Check size={16} />
        Добавить {selectedMl ? (selectedMl >= 1000 ? `${selectedMl / 1000}л` : `${selectedMl}мл`) : amount ? `${amount}мл` : ""}
      </button>

      {/* Записи за день */}
      {entries.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }} className="pt-3">
          <div className="text-xs mb-2" style={{ color: "rgba(134,205,217,0.7)" }}>Сегодня:</div>
          <div className="space-y-1">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <span style={{ color: "#86CDD9" }}>{entry.amount} мл</span>
                <span className="text-xs" style={{ color: "rgba(134,205,217,0.5)" }}>
                  {new Date(entry.createdAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Popup mode — floating рядом с кнопкой, непрозрачный фон
  if (mode === "popup") {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 z-50">
        <div className="fixed inset-0 z-[-1]" onClick={onClose} />
        <div
          className="p-4 rounded-2xl animate-fade-in"
          style={{
            background: "#0a3d4f",
            border: "1px solid rgba(23,155,176,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets size={16} style={{ color: "#179BB0" }} />
              <span className="text-sm font-medium text-white">Добавить воду</span>
            </div>
            <button onClick={onClose} className="hover:opacity-70 transition-opacity" style={{ color: "#86CDD9" }}>
              <X size={16} />
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  // Modal mode — по центру экрана
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
        <div
          className="px-5 py-4 text-white flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #179BB0, #16A085)" }}
        >
          <div className="flex items-center gap-2">
            <Droplets size={18} />
            <span className="font-medium">Добавить воду</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {content}
        </div>
      </div>
    </div>
  );
}
