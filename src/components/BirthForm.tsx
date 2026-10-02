"use client";

import { useState } from "react";
import { CITIES } from "@/lib/saju/cities";
import type { SajuInput } from "@/lib/saju/types";

const CUSTOM = "__custom__";

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-base outline-none focus:border-[var(--accent)]";

export default function BirthForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (input: SajuInput) => void;
  disabled: boolean;
}) {
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [date, setDate] = useState({ year: "", month: "", day: "" });
  const [time, setTime] = useState({ hour: "", minute: "" });
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("female");
  const [city, setCity] = useState(CITIES[0].name);
  const [customLongitude, setCustomLongitude] = useState("");
  const [applyTrueSolarTime, setApplyTrueSolarTime] = useState(true);
  const [applyDaylightSaving, setApplyDaylightSaving] = useState(true);
  const [useYaJaSi, setUseYaJaSi] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const custom = city === CUSTOM;
    onSubmit({
      calendar,
      isLeapMonth: calendar === "lunar" && isLeapMonth,
      year: Number(date.year),
      month: Number(date.month),
      day: Number(date.day),
      hour: timeUnknown ? null : Number(time.hour),
      minute: timeUnknown ? null : Number(time.minute || 0),
      gender,
      longitude: custom ? Number(customLongitude) : CITIES.find((c) => c.name === city)!.longitude,
      placeName: custom ? "직접 입력" : city,
      applyTrueSolarTime,
      applyDaylightSaving,
      useYaJaSi,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2">
        {(["solar", "lunar"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCalendar(c)}
            className={`flex-1 rounded-lg border px-3 py-2 font-medium ${
              calendar === c
                ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                : "border-[var(--line)] bg-[var(--card)]"
            }`}
          >
            {c === "solar" ? "양력" : "음력"}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">생년월일</label>
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
          <input
            className={fieldClass}
            inputMode="numeric"
            placeholder="1990"
            required
            value={date.year}
            onChange={(e) => setDate({ ...date, year: e.target.value })}
            aria-label="년"
          />
          <input
            className={fieldClass}
            inputMode="numeric"
            placeholder="월"
            required
            value={date.month}
            onChange={(e) => setDate({ ...date, month: e.target.value })}
            aria-label="월"
          />
          <input
            className={fieldClass}
            inputMode="numeric"
            placeholder="일"
            required
            value={date.day}
            onChange={(e) => setDate({ ...date, day: e.target.value })}
            aria-label="일"
          />
        </div>
        {calendar === "lunar" && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isLeapMonth} onChange={(e) => setIsLeapMonth(e.target.checked)} />
            윤달
          </label>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-[var(--muted)]">태어난 시간 (24시간제)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={fieldClass}
            inputMode="numeric"
            placeholder="시 (0~23)"
            required={!timeUnknown}
            disabled={timeUnknown}
            value={time.hour}
            onChange={(e) => setTime({ ...time, hour: e.target.value })}
            aria-label="시"
          />
          <input
            className={fieldClass}
            inputMode="numeric"
            placeholder="분"
            disabled={timeUnknown}
            value={time.minute}
            onChange={(e) => setTime({ ...time, minute: e.target.value })}
            aria-label="분"
          />
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
          태어난 시간을 몰라요
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">성별</label>
          <select className={fieldClass} value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}>
            <option value="female">여성</option>
            <option value="male">남성</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]">출생지</label>
          <select className={fieldClass} value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
            <option value={CUSTOM}>직접 입력 (경도)</option>
          </select>
        </div>
      </div>
      {city === CUSTOM && (
        <input
          className={fieldClass}
          inputMode="decimal"
          placeholder="동경 경도, 예: 127.5"
          required
          value={customLongitude}
          onChange={(e) => setCustomLongitude(e.target.value)}
          aria-label="경도"
        />
      )}

      <div className="rounded-lg border border-[var(--line)] bg-[var(--card)] p-3 text-sm">
        <button type="button" className="text-[var(--muted)]" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "▾" : "▸"} 시간 보정 설정
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={applyTrueSolarTime}
                onChange={(e) => setApplyTrueSolarTime(e.target.checked)}
              />
              <span>
                진태양시 보정 <span className="text-[var(--muted)]">— 출생지 경도에 맞춰 시간을 보정 (서울 약 −32분)</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={applyDaylightSaving}
                onChange={(e) => setApplyDaylightSaving(e.target.checked)}
              />
              <span>
                서머타임 보정 <span className="text-[var(--muted)]">— 1948~1951·1955~1960·1987~1988년 시행 기간이면 1시간 빼기</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={useYaJaSi} onChange={(e) => setUseYaJaSi(e.target.checked)} />
              <span>
                야자시 적용 <span className="text-[var(--muted)]">— 밤 11시~자정 출생을 당일 일주로 계산</span>
              </span>
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-[var(--accent)] py-3 text-lg font-bold text-white disabled:opacity-50"
      >
        {disabled ? "풀이 중…" : "사주 보기"}
      </button>
    </form>
  );
}
