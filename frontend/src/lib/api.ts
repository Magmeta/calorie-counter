const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Ошибка запроса";
    const text = await response.text();
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const responseText = await response.text();
  if (!responseText) return null;
  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

// Привычки
export async function getHabits() {
  return apiRequest("/api/habits");
}

export async function addHabit(text: string) {
  return apiRequest("/api/habits", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function deleteHabit(id: number) {
  return apiRequest(`/api/habits/${id}`, { method: "DELETE" });
}

// Вода
export async function addWater(amount: number) {
  return apiRequest("/api/water", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getDailyWater(date?: string) {
  const param = date ? `?date=${date}` : "";
  return apiRequest(`/api/water/daily${param}`);
}

export async function deleteWater(id: number) {
  return apiRequest(`/api/water/${id}`, { method: "DELETE" });
}

export async function login(username: string, password: string) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  return data;
}

export async function register(username: string, email: string, password: string) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("username", data.username);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
}

export async function getDailyMood(date?: string) {
  const param = date ? `?date=${date}` : "";
  return apiRequest(`/api/meals/mood${param}`);
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

export async function sendPhoto(file: File, message: string, chatMode: string) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("message", message);
  formData.append("chatMode", chatMode);

  const response = await fetch(`${API_URL}/api/chat/photo`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Ошибка загрузки фото");
  }

  return response.json();
}
