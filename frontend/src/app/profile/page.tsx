"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, isAuthenticated } from "@/lib/api";
import BodyAvatar from "@/components/BodyAvatar";
import ProfileReports from "@/components/ProfileReports";
import { ArrowLeft, Save, User, BarChart3 } from "lucide-react";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Мужской" },
  { value: "FEMALE", label: "Женский" },
];

const ACTIVITY_OPTIONS = [
  { value: "SEDENTARY", label: "Сидячий образ жизни" },
  { value: "LIGHT", label: "Лёгкая активность (1-2 раза/нед)" },
  { value: "MODERATE", label: "Умеренная (3-4 раза/нед)" },
  { value: "ACTIVE", label: "Активный (5-6 раз/нед)" },
  { value: "VERY_ACTIVE", label: "Очень активный (каждый день)" },
];

const GOAL_OPTIONS = [
  { value: "LOSE_WEIGHT", label: "Похудеть" },
  { value: "GAIN_WEIGHT", label: "Набрать вес" },
  { value: "MAINTAIN_WEIGHT", label: "Поддерживать вес" },
  { value: "BUILD_MUSCLE", label: "Набрать мышечную массу" },
];

interface ProfileData {
  height: number | "";
  weight: number | "";
  age: number | "";
  gender: string;
  activityLevel: string;
  goal: string;
}

type Tab = "data" | "archive";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    height: "",
    weight: "",
    age: "",
    gender: "",
    activityLevel: "",
    goal: "",
  });
  const [dailyNorm, setDailyNorm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("data");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProfile();
  }, [router]);

  async function loadProfile() {
    try {
      const data = await apiRequest("/api/profile");
      if (data) {
        setProfile({
          height: data.height || "",
          weight: data.weight || "",
          age: data.age || "",
          gender: data.gender || "",
          activityLevel: data.activityLevel || "",
          goal: data.goal || "",
        });
        setDailyNorm(data.dailyCalorieNorm);
      }
    } catch {
      // профиль ещё не создан
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setDailyNorm(data.dailyCalorieNorm);
      setMessage("Профиль сохранён");
    } catch {
      setMessage("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ position: "relative", zIndex: 1 }}>
        <p style={{ color: "rgba(134,205,217,0.5)" }}>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ position: "relative", zIndex: 1 }}>
      <div className="max-w-lg mx-auto space-y-4">
        {/* Шапка */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Профиль</h1>
          <Link href="/" className="flex items-center gap-1.5 text-sm transition-colors" style={{ color: "#86CDD9" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#86CDD9")}>
            <ArrowLeft size={16} />
            Назад
          </Link>
        </div>

        {/* Сообщение */}
        {message && (
          <div
            className="p-3 rounded-xl text-sm animate-fade-in"
            style={{
              background: message.includes("Ошибка") ? "rgba(239,68,68,0.15)" : "rgba(22,160,133,0.15)",
              color: message.includes("Ошибка") ? "#ef4444" : "#16A085",
            }}
          >
            {message}
          </div>
        )}

        {/* Аватар */}
        <div className="glass p-4">
          <BodyAvatar gender={profile.gender} height={profile.height} weight={profile.weight} />
        </div>

        {/* Вкладки */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("data")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all"
            style={activeTab === "data"
              ? { background: "linear-gradient(135deg, #179BB0, #16A085)", color: "#fff" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(134,205,217,0.7)" }
            }
          >
            <User size={15} />
            Данные
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-sm font-medium transition-all"
            style={activeTab === "archive"
              ? { background: "linear-gradient(135deg, #179BB0, #16A085)", color: "#fff" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(134,205,217,0.7)" }
            }
          >
            <BarChart3 size={15} />
            Архив
          </button>
        </div>

        {/* Контент вкладок */}
        {activeTab === "data" ? (
          <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                  Рост (см)
                </label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value ? Number(e.target.value) : "" })}
                  className="input-dark"
                  required
                  min={50}
                  max={300}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                  Вес (кг)
                </label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value ? Number(e.target.value) : "" })}
                  className="input-dark"
                  required
                  min={20}
                  max={500}
                  step={0.1}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                Возраст
              </label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : "" })}
                className="input-dark"
                required
                min={10}
                max={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                Пол
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="input-dark"
                required
              >
                <option value="">Выберите</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                Уровень активности
              </label>
              <select
                value={profile.activityLevel}
                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                className="input-dark"
                required
              >
                <option value="">Выберите</option>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
                Цель
              </label>
              <select
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                className="input-dark"
                required
              >
                <option value="">Выберите</option>
                {GOAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {dailyNorm && (
              <div className="glass p-4">
                <p className="text-sm" style={{ color: "#86CDD9" }}>Ваша дневная норма калорий:</p>
                <p className="text-2xl font-bold" style={{ color: "#179BB0" }}>{dailyNorm} ккал</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <Save size={17} />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </form>
        ) : (
          <div className="glass p-4">
            <ProfileReports />
          </div>
        )}
      </div>
    </div>
  );
}
