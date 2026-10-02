/**
 * 출생 시각 보정.
 *
 * - 한국의 과거 표준시/서머타임 정보는 Node에 내장된 시간대 데이터(Asia/Seoul)를 그대로 쓴다.
 *   (1948~1951, 1955~1960, 1987~1988 서머타임 / 1954~1961 UTC+8:30 표준시 등이 모두 들어 있다)
 * - 진태양시는 출생지 경도로 계산한 지방평균시(UTC + 경도 × 4분)를 쓴다.
 */

const MINUTE = 60_000;

export interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  timeZoneName: "longOffset",
});

/** 주어진 순간(UTC ms)의 서울 UTC 오프셋(분) */
export function seoulOffsetMinutes(utcMs: number): number {
  const part = offsetFormatter.formatToParts(new Date(utcMs)).find((p) => p.type === "timeZoneName");
  const m = part?.value.match(/GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return 540;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]) + Number(m[4] ?? 0) / 60);
}

/** 서머타임을 뺀 한국 표준시 오프셋(분) */
export function seoulStandardOffsetMinutes(utcMs: number): number {
  const total = seoulOffsetMinutes(utcMs);
  // 표준시는 UTC+8:30(1908~1911, 1954.3.21~1961.8.9) 또는 UTC+9. 서머타임은 여기에 +1시간.
  if (total === 570) return 510; // 8:30 + 서머타임
  if (total === 600) return 540; // 9:00 + 서머타임
  return total; // 510, 540, 또는 1908년 이전 지방시
}

function wallToMs(w: WallTime): number {
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
}

export function msToWall(ms: number): WallTime {
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

export function formatWall(w: WallTime): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.year}-${p(w.month)}-${p(w.day)} ${p(w.hour)}:${p(w.minute)}`;
}

/** 서울 시계로 읽은 시각 → 실제 순간(UTC ms) */
function seoulWallToUtc(w: WallTime): number {
  const wall = wallToMs(w);
  let utc = wall - 540 * MINUTE;
  for (let i = 0; i < 3; i++) {
    const next = wall - seoulOffsetMinutes(utc) * MINUTE;
    if (next === utc) break;
    utc = next;
  }
  return utc;
}

export interface CorrectionResult {
  /** 절기(년주·월주·대운) 판정용 시각. lunar-javascript의 절기 시각 기준(UTC+8)으로 바꾼 값 */
  jieqiBasis: WallTime;
  /** 일주·시주 판정용 시각 */
  dayHourBasis: WallTime;
  standardOffsetMinutes: number;
  daylightSavingMinutes: number;
  longitudeMinutes: number;
}

export function correctBirthTime(
  clock: WallTime,
  opts: { longitude: number; applyTrueSolarTime: boolean; applyDaylightSaving: boolean },
): CorrectionResult {
  const firstGuess = seoulWallToUtc(clock);
  const totalOffset = seoulOffsetMinutes(firstGuess);
  const standardOffset = seoulStandardOffsetMinutes(firstGuess);
  const dst = Math.max(0, totalOffset - standardOffset);

  // 서머타임 보정을 끄면 시계 시각을 표준시로 간주한다.
  const usedOffset = opts.applyDaylightSaving ? totalOffset : standardOffset;
  const instant = wallToMs(clock) - usedOffset * MINUTE;

  const longitudeMinutes = opts.longitude * 4 - standardOffset;
  const dayHourMs = opts.applyTrueSolarTime
    ? instant + Math.round(opts.longitude * 4 * MINUTE)
    : instant + standardOffset * MINUTE;

  return {
    jieqiBasis: msToWall(instant + 480 * MINUTE),
    dayHourBasis: msToWall(dayHourMs),
    standardOffsetMinutes: standardOffset,
    daylightSavingMinutes: opts.applyDaylightSaving ? dst : 0,
    longitudeMinutes: opts.applyTrueSolarTime ? Math.round(longitudeMinutes) : 0,
  };
}
