"use client";

import { useEffect, useState } from "react";
import { addWater, getDailyWater } from "@/lib/api";

interface WaterEntry {
  id: number;
  amount: number;
  entryDate: string;
  createdAt: string;
}

interface WaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [200, 250, 330, 500];

export default function WaterModal({ isOpen, onClose }: WaterModalProps) {
  const [amount, setAmount] = useState("");
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
      await loadDailyWater();
    } catch {
      // ошибка
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ml = parseInt(amount);
    if (isNaN(ml) || ml <= 0) return;
    await handleAdd(ml);
  }

  if (!isOpen) return null;

  // Норма воды ~2000мл
  const waterNorm = 2000;
  const percentage = Math.min(Math.round((totalMl / waterNorm) * 100), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Шапка */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #179BB0, #15565B)" }}
        >
          <span className="font-medium">Добавить воду</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Итого за день */}
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: "#179BB0" }}>
              {totalMl} мл
            </div>
            <div className="text-xs text-gray-500 mt-1">из {waterNorm} мл ({percentage}%)</div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
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
                onClick={() => handleAdd(ml)}
                disabled={loading}
                className="py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {ml} мл
              </button>
            ))}
          </div>

          {/* Произвольное количество */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Другое количество (мл)"
              min="1"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !amount || parseInt(amount) <= 0}
              className="px-4 py-2 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg, #179BB0, #15565B)" }}
            >
              +
            </button>
          </form>

          {/* Записи за день */}
          {entries.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500 mb-2">Сегодня:</div>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm text-gray-600">
                    <span>{entry.amount} мл</span>
                    <span className="text-xs text-gray-400">
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
      </div>
    </div>
  );
}
