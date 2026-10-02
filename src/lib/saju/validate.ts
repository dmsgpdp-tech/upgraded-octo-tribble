import { SajuInputError } from "./calculate";
import type { SajuInput } from "./types";

function int(v: unknown, name: string, min: number, max: number): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw new SajuInputError(`${name} 값이 올바르지 않습니다.`);
  }
  return n;
}

/** 요청 본문(JSON)을 검증해서 SajuInput으로 만든다. */
export function parseSajuInput(body: unknown): SajuInput {
  if (!body || typeof body !== "object") throw new SajuInputError("입력이 비어 있습니다.");
  const b = body as Record<string, unknown>;

  const timeKnown = b.hour !== null && b.hour !== undefined && b.hour !== "";
  const longitude = typeof b.longitude === "number" ? b.longitude : Number(b.longitude);
  if (!Number.isFinite(longitude) || longitude < 120 || longitude > 135) {
    throw new SajuInputError("출생지 경도는 동경 120°~135° 사이여야 합니다.");
  }

  return {
    calendar: b.calendar === "lunar" ? "lunar" : "solar",
    isLeapMonth: b.calendar === "lunar" && b.isLeapMonth === true,
    year: int(b.year, "연도", 1900, 2100),
    month: int(b.month, "월", 1, 12),
    day: int(b.day, "일", 1, 31),
    hour: timeKnown ? int(b.hour, "시", 0, 23) : null,
    minute: timeKnown ? int(b.minute ?? 0, "분", 0, 59) : null,
    gender: b.gender === "female" ? "female" : "male",
    longitude,
    placeName: typeof b.placeName === "string" && b.placeName.trim() ? b.placeName.trim().slice(0, 30) : "출생지",
    applyTrueSolarTime: b.applyTrueSolarTime !== false,
    applyDaylightSaving: b.applyDaylightSaving !== false,
    useYaJaSi: b.useYaJaSi === true,
  };
}
