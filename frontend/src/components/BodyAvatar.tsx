"use client";

import { useState } from "react";

interface BodyAvatarProps {
  gender: string;
  height: number | "";
  weight: number | "";
}

function getBmiInfo(weight: number, height: number): { value: string; label: string; color: string } {
  const bmi = weight / ((height / 100) ** 2);
  const bmiStr = bmi.toFixed(1);
  if (bmi < 18.5) return { value: bmiStr, label: "Недостаточный вес", color: "#86CDD9" };
  if (bmi < 25) return { value: bmiStr, label: "Норма", color: "#16A085" };
  if (bmi < 30) return { value: bmiStr, label: "Избыточный вес", color: "#f59e0b" };
  return { value: bmiStr, label: "Ожирение", color: "#ef4444" };
}

/* Мужской силуэт — единый замкнутый контур */
function MaleSilhouette() {
  return (
    <path
      d={`
        M 50,8
        C 44,8 40,14 40,20
        C 40,26 44,31 50,32
        L 50,32
        C 48,33 46,34 44,35
        L 42,36
        C 37,38 32,42 28,48
        C 25,53 24,58 23,64
        L 20,80
        C 19,84 19,87 20,89
        L 23,89
        C 23,86 23,84 24,80
        L 26,66
        C 27,60 29,55 32,50
        L 34,48
        L 34,68
        L 33,90
        L 32,110
        C 31,120 31,130 32,140
        L 34,158
        L 36,180
        L 36,196
        C 36,199 35,201 34,203
        L 31,208
        L 31,213
        L 44,213
        L 44,209
        L 40,204
        L 40,196
        L 42,170
        L 44,150
        L 46,130
        L 48,118
        L 50,118
        L 52,130
        L 54,150
        L 56,170
        L 58,196
        L 58,204
        L 54,209
        L 54,213
        L 67,213
        L 67,208
        L 64,203
        C 63,201 62,199 62,196
        L 62,180
        L 64,158
        C 65,140 66,130 66,110
        L 65,90
        L 64,68
        L 64,48
        L 66,50
        C 69,55 71,60 72,66
        L 74,80
        C 75,84 75,86 75,89
        L 78,89
        C 79,87 79,84 78,80
        L 75,64
        C 74,58 73,53 70,48
        C 66,42 61,38 56,36
        L 54,35
        C 52,34 50,33 48,32
        L 48,32
        C 54,31 58,26 58,20
        C 58,14 54,8 50,8
        Z
      `}
      stroke="#86CDD9"
      strokeWidth="1.3"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

/* Женский силуэт — единый замкнутый контур */
function FemaleSilhouette() {
  return (
    <>
      {/* Голова с волосами */}
      <path
        d={`
          M 50,6
          C 43,6 39,12 39,19
          C 39,25 42,29 46,31
          C 44,32 42,33 40,34
          L 37,36
          C 36,34 34,32 33,31
          C 31,30 30,30 30,32
          L 31,36
          L 34,38
          L 37,36
        `}
        stroke="#86CDD9"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={`
          M 50,6
          C 57,6 61,12 61,19
          C 61,25 58,29 54,31
          C 56,32 58,33 60,34
          L 63,36
          C 64,34 66,32 67,31
          C 69,30 70,30 70,32
          L 69,36
          L 66,38
          L 63,36
        `}
        stroke="#86CDD9"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Тело — единый контур */}
      <path
        d={`
          M 37,36
          C 32,39 28,44 26,50
          C 24,56 23,62 22,68
          L 20,80
          C 19,84 19,86 20,88
          L 23,88
          C 23,86 23,83 24,80
          L 26,68
          C 27,62 29,56 31,52
          L 33,48
          L 34,58
          C 35,64 36,70 37,76
          L 38,84
          C 39,88 38,92 36,96
          C 34,100 32,106 32,112
          L 31,122
          C 31,128 32,134 33,140
          L 35,156
          L 36,176
          L 36,196
          C 36,199 35,201 34,203
          L 31,208
          L 31,213
          L 44,213
          L 44,209
          L 40,204
          L 40,196
          L 42,170
          L 44,150
          L 46,134
          L 48,120
          L 50,120
          L 52,134
          L 54,150
          L 56,170
          L 58,196
          L 58,204
          L 54,209
          L 54,213
          L 67,213
          L 67,208
          L 64,203
          C 63,201 62,199 62,196
          L 62,176
          L 63,156
          C 64,134 66,128 67,122
          L 66,112
          C 66,106 64,100 62,96
          C 60,92 59,88 60,84
          L 61,76
          C 62,70 63,64 64,58
          L 65,48
          L 67,52
          C 69,56 71,62 72,68
          L 74,80
          C 75,83 75,86 75,88
          L 78,88
          C 79,86 79,84 78,80
          L 76,68
          C 75,62 74,56 72,50
          C 70,44 66,39 63,36
        `}
        stroke="#86CDD9"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  );
}

export default function BodyAvatar({ gender, height, weight }: BodyAvatarProps) {
  const [hovered, setHovered] = useState(false);

  if (!gender || !height || !weight) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-sm" style={{ color: "rgba(134,205,217,0.5)" }}>
        <svg width="80" height="160" viewBox="0 0 100 220" fill="none">
          <circle cx="50" cy="16" r="12" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" fill="none" />
          <line x1="50" y1="28" x2="50" y2="120" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="30" y2="90" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="70" y2="90" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" />
          <line x1="50" y1="120" x2="38" y2="195" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" />
          <line x1="50" y1="120" x2="62" y2="195" stroke="rgba(134,205,217,0.3)" strokeWidth="1.5" />
        </svg>
        <p className="mt-2">Заполните профиль для отображения аватара</p>
      </div>
    );
  }

  const bmi = getBmiInfo(weight, height);
  const isMale = gender === "MALE";

  return (
    <div
      className="flex flex-col items-center py-4 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "default" }}
    >
      <div className="relative">
        <svg width="100" height="180" viewBox="10 0 80 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isMale ? <MaleSilhouette /> : <FemaleSilhouette />}
        </svg>

        {/* Hover — ИМТ поверх силуэта */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        >
          <div
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: "rgba(5,53,69,0.9)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${bmi.color}`,
              color: bmi.color,
              whiteSpace: "nowrap",
            }}
          >
            ИМТ: {bmi.value} — {bmi.label}
          </div>
        </div>
      </div>
    </div>
  );
}
