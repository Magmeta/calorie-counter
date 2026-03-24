"use client";

import { X } from "lucide-react";

export interface TableColumnConfig {
  weight: boolean;
  calories: boolean;
  protein: boolean;
  fat: boolean;
  carbs: boolean;
  mood: boolean;
}

const DEFAULT_CONFIG: TableColumnConfig = {
  weight: true,
  calories: true,
  protein: true,
  fat: true,
  carbs: true,
  mood: false,
};

const STORAGE_KEY = "tableColumnConfig";

export function getTableConfig(): TableColumnConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch { /* ошибка парсинга */ }
  return DEFAULT_CONFIG;
}

export function saveTableConfig(config: TableColumnConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface TableSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: TableColumnConfig;
  onChange: (config: TableColumnConfig) => void;
}

const COLUMN_LABELS: Record<keyof TableColumnConfig, string> = {
  weight: "Вес (г)",
  calories: "Калории",
  protein: "Белки",
  fat: "Жиры",
  carbs: "Углеводы",
  mood: "Настроение",
};

export default function TableSettings({ isOpen, onClose, config, onChange }: TableSettingsProps) {
  if (!isOpen) return null;

  function toggle(key: keyof TableColumnConfig) {
    if (key === "calories") return;
    const newConfig = { ...config, [key]: !config[key] };
    onChange(newConfig);
    saveTableConfig(newConfig);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="glass relative p-5 w-full max-w-xs animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Настройки таблицы</h3>
          <button onClick={onClose} className="transition-colors" style={{ color: "#86CDD9" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {(Object.keys(COLUMN_LABELS) as (keyof TableColumnConfig)[]).map((key) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm" style={{ color: "#86CDD9" }}>{COLUMN_LABELS[key]}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={() => toggle(key)}
                  disabled={key === "calories"}
                  className="sr-only peer"
                />
                <div
                  className={`w-10 h-5 rounded-full transition-colors ${key === "calories" ? "opacity-50" : ""}`}
                  style={{ background: config[key] ? "linear-gradient(135deg, #179BB0, #16A085)" : "rgba(255,255,255,0.1)" }}
                />
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow transition-transform peer-checked:translate-x-5"
                  style={{ background: "#fff" }}
                />
              </div>
            </label>
          ))}
        </div>

        {config.mood && (
          <p className="mt-3 text-xs" style={{ color: "rgba(134,205,217,0.5)" }}>
            Настроение можно записать через чат: &quot;настроение: отличное&quot;
          </p>
        )}

        <button onClick={onClose} className="btn-primary mt-4 w-full py-2 text-sm">
          Готово
        </button>
      </div>
    </div>
  );
}
