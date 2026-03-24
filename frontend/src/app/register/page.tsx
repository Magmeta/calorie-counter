"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(username, email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ position: "relative", zIndex: 1 }}>
      <div className="glass w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Регистрация</h1>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-red-400" style={{ background: "rgba(239,68,68,0.15)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
              Имя пользователя
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-dark"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#86CDD9" }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            <UserPlus size={18} />
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: "#86CDD9" }}>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="hover:text-white transition-colors underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
