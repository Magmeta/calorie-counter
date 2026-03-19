"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, isAuthenticated, logout, sendPhoto } from "@/lib/api";
import DailyTable from "@/components/DailyTable";

interface Message {
  id?: number;
  role: string;
  content: string;
  chatMode: string;
  imageUrl?: string;
}

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"DIARY" | "QUESTION">("DIARY");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setUsername(localStorage.getItem("username"));
    loadHistory();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const data = await apiRequest("/api/chat/history");
      setMessages(data.reverse());
    } catch {
      // история пустая
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!input.trim() && !selectedImage) return;

    const messageText = input.trim() || (selectedImage ? "Что это за блюдо? Сколько здесь калорий?" : "");

    const userMessage: Message = {
      role: "USER",
      content: selectedImage ? `[Фото] ${messageText}` : messageText,
      chatMode,
      imageUrl: imagePreview || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let data;
      if (selectedImage) {
        data = await sendPhoto(selectedImage, messageText, chatMode);
        clearImage();
      } else {
        data = await apiRequest("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message: messageText, chatMode }),
        });
      }

      const aiMessage: Message = {
        role: "ASSISTANT",
        content: data.reply,
        chatMode: data.chatMode,
      };
      setMessages((prev) => [...prev, aiMessage]);
      if (chatMode === "DIARY") {
        setTableRefresh((prev) => prev + 1);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Ошибка получения ответа", chatMode },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!username) return null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Шапка */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">Calorie Counter</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTableOpen(true)}
            className="text-blue-600 hover:underline text-sm"
          >
            Таблицы
          </button>
          <Link href="/profile" className="text-blue-600 hover:underline text-sm">
            Профиль
          </Link>
          <span className="text-gray-600 text-sm">{username}</span>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="px-3 py-1 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Переключатель режимов */}
      <div className="bg-white border-b px-6 py-2 flex gap-2">
        <button
          onClick={() => setChatMode("DIARY")}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            chatMode === "DIARY"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Дневник
        </button>
        <button
          onClick={() => setChatMode("QUESTION")}
          className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
            chatMode === "QUESTION"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Вопрос
        </button>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            {chatMode === "DIARY"
              ? "Напиши что ты ел или отправь фото — я посчитаю калории"
              : "Задай вопрос о питании"}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === "USER"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 border rounded-bl-md shadow-sm"
              }`}
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Фото еды"
                  className="max-w-full rounded-lg mb-2 max-h-64 object-cover"
                />
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <span className="text-gray-400 text-sm">Анализирую...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Превью выбранного изображения */}
      {imagePreview && (
        <div className="bg-white border-t px-6 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Превью"
              className="h-16 w-16 object-cover rounded-lg border"
            />
            <span className="text-sm text-gray-600">{selectedImage?.name}</span>
            <button
              onClick={clearImage}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Поле ввода */}
      <form onSubmit={handleSend} className="bg-white border-t px-6 py-4">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            title="Добавить фото"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedImage
                ? "Добавь комментарий к фото (необязательно)..."
                : chatMode === "DIARY"
                ? "Напиши что ты ел..."
                : "Задай вопрос..."
            }
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || (!input.trim() && !selectedImage)}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Отправить
          </button>
        </div>
      </form>

      {/* Боковая панель с таблицей */}
      <DailyTable isOpen={tableOpen} onClose={() => setTableOpen(false)} refreshTrigger={tableRefresh} />
    </div>
  );
}
