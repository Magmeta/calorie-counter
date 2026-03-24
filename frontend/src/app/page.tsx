"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest, isAuthenticated, logout, sendPhoto } from "@/lib/api";
import DailyTable from "@/components/DailyTable";
import HabitsPanel from "@/components/HabitsPanel";
import WaterModal from "@/components/WaterModal";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Camera,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  BookOpen,
  Droplets,
  X,
} from "lucide-react";

interface Message {
  id?: number;
  role: string;
  content: string;
  chatMode: string;
  imageUrl?: string;
  notification?: string;
  createdAt?: string;
}

function formatMessageDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hh}:${mm} ${day}-${month}-${year}`;
  } catch {
    return "";
  }
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [habitsOpen, setHabitsOpen] = useState(false);
  const [waterPopupOpen, setWaterPopupOpen] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [habitsRefresh, setHabitsRefresh] = useState(0);
  // Мобильный overlay для таблиц
  const [mobileTableOpen, setMobileTableOpen] = useState(false);
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

  // Определяем мобильный экран
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
      createdAt: new Date().toISOString(),
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

      if (data.notification) {
        setMessages((prev) => [...prev, {
          role: "NOTIFICATION",
          content: data.notification,
          chatMode: data.chatMode,
          createdAt: new Date().toISOString(),
        }]);
      }

      const aiMessage: Message = {
        role: "ASSISTANT",
        content: data.reply,
        chatMode: data.chatMode,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      if (chatMode === "DIARY") {
        setTableRefresh((prev) => prev + 1);
      }
      if (data.notification && data.notification.includes("привычку")) {
        setHabitsRefresh((prev) => prev + 1);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ASSISTANT", content: "Ошибка получения ответа", chatMode, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!username) return null;

  return (
    <div className="h-screen flex flex-col" style={{ position: "relative", zIndex: 1 }}>
      {/* ===== Header ===== */}
      <header className="glass flex items-center justify-between px-5 py-3" style={{ borderRadius: 0, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <h1 className="text-lg font-bold text-white tracking-wide">Calorie Counter</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHabitsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "#86CDD9" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#86CDD9")}
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Привычки</span>
          </button>
          {/* Мобильные кнопки */}
          {isMobile && (
            <>
              <button
                onClick={() => setWaterPopupOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ color: "#86CDD9" }}
              >
                <Droplets size={16} />
                <span className="hidden sm:inline">Вода</span>
              </button>
              <button
                onClick={() => setMobileTableOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ color: "#86CDD9" }}
              >
                Таблицы
              </button>
            </>
          )}
          <Link
            href="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "#86CDD9" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#86CDD9")}
          >
            <User size={16} />
            <span className="hidden sm:inline">{username}</span>
          </Link>
          <button
            onClick={() => { logout(); window.location.href = "/login"; }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: "rgba(134,205,217,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(134,205,217,0.6)")}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ===== Main: 2 колонки ===== */}
      <div className="flex-1 flex overflow-hidden">

        {/* ===== Левая колонка: Чат ===== */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Переключатель режимов */}
          <div className="px-5 py-2.5 flex gap-2">
            {(["DIARY", "QUESTION"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setChatMode(mode)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  chatMode === mode ? "text-white" : "glass-hover text-white/60 hover:text-white"
                }`}
                style={chatMode === mode ? { background: "linear-gradient(135deg, #179BB0, #16A085)" } : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {mode === "DIARY" ? "Дневник" : "Вопрос"}
              </button>
            ))}
          </div>

          {/* Сообщения — текстовый поток без пузырей */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-3 mx-auto w-full" style={{ maxWidth: "770px", paddingLeft: "20px", paddingRight: "20px" }}>
            {messages.length === 0 && (
              <div className="text-center mt-20" style={{ color: "rgba(134,205,217,0.5)" }}>
                {chatMode === "DIARY"
                  ? "Напиши что ты ел или отправь фото — я посчитаю калории"
                  : "Задай вопрос о питании"}
              </div>
            )}

            {messages.map((msg, i) => (
              msg.role === "NOTIFICATION" ? (
                <div key={i} className="flex justify-center">
                  <div className="px-4 py-1.5 rounded-full text-xs font-medium text-white"
                       style={{ background: "linear-gradient(135deg, #179BB0, #15565B)" }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div key={i} className={`space-y-1 ${msg.role === "USER" ? "flex flex-col items-end" : ""}`}>
                  {/* Метка отправителя */}
                  <div className="text-xs font-medium" style={{ color: msg.role === "USER" ? "rgba(255,255,255,0.4)" : "rgba(22,160,133,0.7)" }}>
                    {msg.role === "USER" ? "Вы" : "AI"}
                  </div>
                  {/* Фото если есть */}
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Фото еды"
                      className="max-w-xs rounded-xl max-h-48 object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  )}
                  {/* Текст сообщения */}
                  {msg.role === "USER" ? (
                    <div
                      className="inline-block text-sm leading-relaxed px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "#FFFFFF",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className="text-sm leading-relaxed"
                      style={{ color: "#FFFFFF", overflowWrap: "break-word", wordBreak: "break-word" }}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                          strong: ({ children }) => <strong className="font-semibold" style={{ color: "#86CDD9" }}>{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {/* Дата сообщения */}
                  {formatMessageDate(msg.createdAt) && (
                    <div className="text-[10px] mt-0.5" style={{ color: "rgba(134,205,217,0.35)" }}>
                      {formatMessageDate(msg.createdAt)}
                    </div>
                  )}
                </div>
              )
            ))}

            {loading && (
              <div className="space-y-1">
                <div className="text-xs font-medium" style={{ color: "rgba(22,160,133,0.7)" }}>AI</div>
                <div className="text-sm text-white">
                  <span className="animate-pulse">Анализирую...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Превью выбранного изображения */}
          {imagePreview && (
            <div className="py-2 mx-auto w-full" style={{ maxWidth: "770px", paddingLeft: "20px", paddingRight: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="Превью" className="h-14 w-14 object-cover rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                <span className="text-sm" style={{ color: "#86CDD9" }}>{selectedImage?.name}</span>
                <button onClick={clearImage} className="text-red-400 hover:text-red-300 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Поле ввода — glowing emerald line */}
          <form onSubmit={handleSend} className="py-4 mx-auto w-full" style={{ maxWidth: "770px", paddingLeft: "5px", paddingRight: "20px" }}>
            <div className="flex items-center gap-2">
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
                className="p-2 rounded-lg transition-colors disabled:opacity-40 flex-shrink-0"
                style={{ color: "#86CDD9" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#16A085")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#86CDD9")}
                title="Добавить фото"
              >
                <Camera size={20} />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    selectedImage
                      ? "Добавь комментарий к фото..."
                      : chatMode === "DIARY"
                      ? "Напиши что ты ел..."
                      : "Задай вопрос..."
                  }
                  className="w-full bg-transparent border-none outline-none text-white text-sm py-2 placeholder-white/30"
                  disabled={loading}
                />
                {/* Glowing emerald line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all"
                  style={{
                    background: "linear-gradient(90deg, #16A085, #179BB0)",
                    boxShadow: "0 0 8px rgba(22,160,133,0.4), 0 0 20px rgba(22,160,133,0.15)",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || (!input.trim() && !selectedImage)}
                className="p-2 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
                style={{ color: "#16A085" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#16A085")}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* ===== Правая колонка: Сайдбар (десктоп) ===== */}
        {!isMobile && (
          <div
            className="relative flex flex-col transition-all duration-300 ease-in-out"
            style={{
              width: sidebarOpen ? "40%" : "0px",
              minWidth: sidebarOpen ? "340px" : "0px",
              maxWidth: sidebarOpen ? "480px" : "0px",
              borderLeft: sidebarOpen ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            {/* Кнопка сворачивания */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            >
              {sidebarOpen ? <ChevronRight size={16} color="#86CDD9" /> : <ChevronLeft size={16} color="#86CDD9" />}
            </button>

            {sidebarOpen && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Кнопка + ВОДА */}
                <div className="relative">
                  <button
                    onClick={() => setWaterPopupOpen(!waterPopupOpen)}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-semibold"
                  >
                    <Droplets size={20} />
                    + ВОДА
                  </button>
                  {/* Water Popup */}
                  {waterPopupOpen && (
                    <WaterModal
                      isOpen={true}
                      onClose={() => setWaterPopupOpen(false)}
                      mode="popup"
                    />
                  )}
                </div>

                {/* Таблицы inline */}
                <DailyTable
                  isOpen={true}
                  onClose={() => {}}
                  refreshTrigger={tableRefresh}
                  mode="inline"
                />
              </div>
            )}
          </div>
        )}

        {/* Сайдбар-кнопка когда свёрнут */}
        {!isMobile && !sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-2 py-4 px-2 transition-colors"
            style={{ color: "#86CDD9", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#86CDD9")}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ===== Мобильный overlay для таблиц ===== */}
      {isMobile && (
        <DailyTable isOpen={mobileTableOpen} onClose={() => setMobileTableOpen(false)} refreshTrigger={tableRefresh} mode="overlay" />
      )}

      {/* Мобильная модалка воды */}
      {isMobile && (
        <WaterModal isOpen={waterPopupOpen} onClose={() => setWaterPopupOpen(false)} mode="modal" />
      )}

      {/* Модалка привычек */}
      <HabitsPanel isOpen={habitsOpen} onClose={() => setHabitsOpen(false)} refreshTrigger={habitsRefresh} />
    </div>
  );
}
