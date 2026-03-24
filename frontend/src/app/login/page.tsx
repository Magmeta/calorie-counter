"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      router.push("/");
    } catch (err) {
      setError("Неверное имя пользователя или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ position: "relative", zIndex: 1 }}>
      <div className="glass w-full max-w-md p-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Вход</h1>

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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            <LogIn size={18} />
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: "#86CDD9" }}>
          Нет аккаунта?{" "}
          <Link href="/register" className="hover:text-white transition-colors underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
