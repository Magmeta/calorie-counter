"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, isAuthenticated } from "@/lib/api";

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
      // профиль ещё не создан — это нормально
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Профиль</h1>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Назад
          </Link>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.includes("Ошибка")
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Рост (см)
              </label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value ? Number(e.target.value) : "" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={50}
                max={300}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Вес (кг)
              </label>
              <input
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value ? Number(e.target.value) : "" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={20}
                max={500}
                step={0.1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Возраст
            </label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: e.target.value ? Number(e.target.value) : "" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min={10}
              max={150}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пол
            </label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Уровень активности
            </label>
            <select
              value={profile.activityLevel}
              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цель
            </label>
            <select
              value={profile.goal}
              onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Ваша дневная норма калорий:</p>
              <p className="text-2xl font-bold text-blue-600">{dailyNorm} ккал</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </div>
    </div>
  );
}
