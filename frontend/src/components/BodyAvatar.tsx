"use client";

interface BodyAvatarProps {
  gender: string;
  height: number | "";
  weight: number | "";
}

function getBodyType(weight: number, height: number): "thin" | "normal" | "overweight" | "obese" {
  const bmi = weight / ((height / 100) ** 2);
  if (bmi < 18.5) return "thin";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function getHeightScale(height: number): number {
  if (height < 155) return 0.88;
  if (height < 165) return 0.92;
  if (height < 175) return 0.96;
  if (height < 185) return 1.0;
  return 1.04;
}

function getBodyParams(bodyType: "thin" | "normal" | "overweight" | "obese") {
  switch (bodyType) {
    case "thin":
      return { torsoWidth: 28, hipWidth: 24, armWidth: 7, legWidth: 9, belly: 0 };
    case "normal":
      return { torsoWidth: 34, hipWidth: 30, armWidth: 9, legWidth: 11, belly: 2 };
    case "overweight":
      return { torsoWidth: 42, hipWidth: 38, armWidth: 11, legWidth: 13, belly: 8 };
    case "obese":
      return { torsoWidth: 50, hipWidth: 46, armWidth: 13, legWidth: 15, belly: 14 };
  }
}

function getBmiLabel(weight: number, height: number): { text: string; color: string } {
  const bmi = weight / ((height / 100) ** 2);
  const bmiStr = bmi.toFixed(1);
  if (bmi < 18.5) return { text: `ИМТ: ${bmiStr} — Недостаточный вес`, color: "#86CDD9" };
  if (bmi < 25) return { text: `ИМТ: ${bmiStr} — Норма`, color: "#16A085" };
  if (bmi < 30) return { text: `ИМТ: ${bmiStr} — Избыточный вес`, color: "#f59e0b" };
  return { text: `ИМТ: ${bmiStr} — Ожирение`, color: "#ef4444" };
}

export default function BodyAvatar({ gender, height, weight }: BodyAvatarProps) {
  if (!gender || !height || !weight) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-sm" style={{ color: "rgba(134,205,217,0.5)" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="25" r="12" stroke="rgba(134,205,217,0.3)" strokeWidth="2" fill="none" />
          <line x1="40" y1="37" x2="40" y2="60" stroke="rgba(134,205,217,0.3)" strokeWidth="2" />
          <line x1="25" y1="45" x2="55" y2="45" stroke="rgba(134,205,217,0.3)" strokeWidth="2" />
          <line x1="40" y1="60" x2="30" y2="78" stroke="rgba(134,205,217,0.3)" strokeWidth="2" />
          <line x1="40" y1="60" x2="50" y2="78" stroke="rgba(134,205,217,0.3)" strokeWidth="2" />
        </svg>
        <p className="mt-2">Заполните профиль для отображения аватара</p>
      </div>
    );
  }

  const bodyType = getBodyType(weight, height);
  const heightScale = getHeightScale(height);
  const params = getBodyParams(bodyType);
  const bmiInfo = getBmiLabel(weight, height);
  const isMale = gender === "MALE";

  const cx = 75;
  const headR = 14;
  const headY = 28;

  // Цвета для тёмной темы
  const skinColor = "#FFDBB4";
  const hairColor = isMale ? "#5C4033" : "#8B5E3C";
  const shirtColor = isMale ? "#179BB0" : "#16A085";
  const pantsColor = "#1a3a4a";

  return (
    <div className="flex flex-col items-center py-4">
      <svg
        width="150"
        height={Math.round(220 * heightScale)}
        viewBox={`0 0 150 ${Math.round(220 * heightScale)}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform={`scale(1, ${heightScale})`}>
          <circle cx={cx} cy={headY} r={headR} fill={skinColor} />

          {isMale ? (
            <path
              d={`M${cx - 13} ${headY - 4} Q${cx} ${headY - 22} ${cx + 13} ${headY - 4}`}
              fill={hairColor}
            />
          ) : (
            <>
              <path
                d={`M${cx - 14} ${headY - 2} Q${cx} ${headY - 24} ${cx + 14} ${headY - 2}`}
                fill={hairColor}
              />
              <ellipse cx={cx - 14} cy={headY + 8} rx={4} ry={14} fill={hairColor} />
              <ellipse cx={cx + 14} cy={headY + 8} rx={4} ry={14} fill={hairColor} />
            </>
          )}

          <circle cx={cx - 5} cy={headY - 1} r={1.5} fill="#374151" />
          <circle cx={cx + 5} cy={headY - 1} r={1.5} fill="#374151" />

          <path
            d={`M${cx - 4} ${headY + 4} Q${cx} ${headY + 8} ${cx + 4} ${headY + 4}`}
            stroke="#374151"
            strokeWidth="1"
            fill="none"
          />

          <rect x={cx - 4} y={headY + headR - 2} width={8} height={8} fill={skinColor} />

          <path
            d={`M${cx - params.torsoWidth / 2} ${headY + headR + 6}
                Q${cx - params.torsoWidth / 2 - 2} ${headY + headR + 50 + params.belly}
                 ${cx - params.hipWidth / 2} ${headY + headR + 60 + params.belly}
                L${cx + params.hipWidth / 2} ${headY + headR + 60 + params.belly}
                Q${cx + params.torsoWidth / 2 + 2} ${headY + headR + 50 + params.belly}
                 ${cx + params.torsoWidth / 2} ${headY + headR + 6}
                Z`}
            fill={shirtColor}
          />

          {params.belly > 2 && (
            <ellipse
              cx={cx}
              cy={headY + headR + 35 + params.belly / 2}
              rx={params.torsoWidth / 2 - 4}
              ry={params.belly + 4}
              fill={shirtColor}
              opacity={0.7}
            />
          )}

          <path
            d={`M${cx - params.torsoWidth / 2} ${headY + headR + 8}
                L${cx - params.torsoWidth / 2 - 12} ${headY + headR + 55}
                L${cx - params.torsoWidth / 2 - 12 + params.armWidth} ${headY + headR + 56}
                L${cx - params.torsoWidth / 2 + params.armWidth - 2} ${headY + headR + 10}
                Z`}
            fill={shirtColor}
          />
          <path
            d={`M${cx + params.torsoWidth / 2} ${headY + headR + 8}
                L${cx + params.torsoWidth / 2 + 12} ${headY + headR + 55}
                L${cx + params.torsoWidth / 2 + 12 - params.armWidth} ${headY + headR + 56}
                L${cx + params.torsoWidth / 2 - params.armWidth + 2} ${headY + headR + 10}
                Z`}
            fill={shirtColor}
          />

          <circle cx={cx - params.torsoWidth / 2 - 9} cy={headY + headR + 57} r={4} fill={skinColor} />
          <circle cx={cx + params.torsoWidth / 2 + 9} cy={headY + headR + 57} r={4} fill={skinColor} />

          <path
            d={`M${cx - params.hipWidth / 2} ${headY + headR + 59 + params.belly}
                L${cx - params.hipWidth / 2 - 3} ${headY + headR + 120 + params.belly}
                L${cx - params.hipWidth / 2 - 3 + params.legWidth} ${headY + headR + 120 + params.belly}
                L${cx - 2} ${headY + headR + 59 + params.belly}
                Z`}
            fill={pantsColor}
          />
          <path
            d={`M${cx + params.hipWidth / 2} ${headY + headR + 59 + params.belly}
                L${cx + params.hipWidth / 2 + 3} ${headY + headR + 120 + params.belly}
                L${cx + params.hipWidth / 2 + 3 - params.legWidth} ${headY + headR + 120 + params.belly}
                L${cx + 2} ${headY + headR + 59 + params.belly}
                Z`}
            fill={pantsColor}
          />

          <ellipse cx={cx - params.hipWidth / 2 + params.legWidth / 2 - 3} cy={headY + headR + 122 + params.belly} rx={params.legWidth / 2 + 2} ry={4} fill="#0d2633" />
          <ellipse cx={cx + params.hipWidth / 2 - params.legWidth / 2 + 3} cy={headY + headR + 122 + params.belly} rx={params.legWidth / 2 + 2} ry={4} fill="#0d2633" />
        </g>
      </svg>

      <div className="mt-2 text-center">
        <span className="text-sm font-medium" style={{ color: bmiInfo.color }}>
          {bmiInfo.text}
        </span>
      </div>
    </div>
  );
}
