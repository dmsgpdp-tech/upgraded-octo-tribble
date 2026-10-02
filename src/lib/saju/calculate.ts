import { Lunar, LunarYear, Solar } from "lunar-javascript";
import {
  branchInfo,
  branchTenGod,
  ganzhiToHangul,
  stemInfo,
  tenGod,
  twelveStage,
} from "./hanja";
import { correctBirthTime, formatWall, type WallTime } from "./timeCorrection";
import type { Element, LuckPillar, Pillar, SajuInput, SajuResult } from "./types";

export class SajuInputError extends Error {}

function toSolar(w: WallTime) {
  return Solar.fromYmdHms(w.year, w.month, w.day, w.hour, w.minute, 0);
}

function buildPillar(ganzhi: string, dayStem: string, isDayPillar = false): Pillar {
  const stem = stemInfo(ganzhi[0]);
  const branch = branchInfo(ganzhi[1]);
  return {
    hanja: ganzhi,
    hangul: stem.hangul + branch.hangul,
    stem: { ...stem, tenGod: isDayPillar ? "일간" : tenGod(dayStem, stem.hanja) },
    branch: {
      hanja: branch.hanja,
      hangul: branch.hangul,
      element: branch.element,
      yinYang: branch.yinYang,
      tenGod: branchTenGod(dayStem, branch.hanja),
      hiddenStems: branch.hiddenStems.map((s) => stemInfo(s).hangul),
      twelveStage: twelveStage(dayStem, branch.hanja),
    },
  };
}

/** 입력 날짜를 양력 날짜로 바꾼다 (음력이면 변환) */
function resolveSolarDate(input: SajuInput): { year: number; month: number; day: number } {
  if (input.calendar === "solar") {
    const d = new Date(Date.UTC(input.year, input.month - 1, input.day));
    if (d.getUTCMonth() !== input.month - 1 || d.getUTCDate() !== input.day) {
      throw new SajuInputError("존재하지 않는 양력 날짜입니다.");
    }
    return { year: input.year, month: input.month, day: input.day };
  }
  if (input.isLeapMonth && LunarYear.fromYear(input.year).getLeapMonth() !== input.month) {
    throw new SajuInputError(`${input.year}년에는 음력 윤${input.month}월이 없습니다.`);
  }
  let solar;
  try {
    const lunar = Lunar.fromYmdHms(input.year, input.isLeapMonth ? -input.month : input.month, input.day, 12, 0, 0);
    solar = lunar.getSolar();
  } catch {
    throw new SajuInputError("존재하지 않는 음력 날짜입니다.");
  }
  // 음력 30일이 없는 달(작은달)인지 다시 확인
  const back = solar.getLunar();
  if (Math.abs(back.getMonth()) !== input.month || back.getDay() !== input.day) {
    throw new SajuInputError("존재하지 않는 음력 날짜입니다. (그 달은 29일까지일 수 있어요)");
  }
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

function formatLunar(year: number, month: number, day: number): string {
  const lunar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar();
  const m = lunar.getMonth();
  return `음력 ${lunar.getYear()}년 ${m < 0 ? "윤" : ""}${Math.abs(m)}월 ${lunar.getDay()}일`;
}

export function calculateSaju(input: SajuInput, now: Date = new Date()): SajuResult {
  if (input.year < 1900 || input.year > 2100) {
    throw new SajuInputError("1900년부터 2100년 사이만 계산할 수 있습니다.");
  }
  const timeKnown = input.hour !== null;
  const date = resolveSolarDate(input);
  // 시간을 모르면 정오 기준으로 년·월·일주를 정한다.
  const clock: WallTime = { ...date, hour: input.hour ?? 12, minute: timeKnown ? (input.minute ?? 0) : 0 };

  const corr = correctBirthTime(clock, input);

  // 년주·월주·대운: 절기 경계를 실제 출생 순간으로 판정
  const jieqiEightChar = toSolar(corr.jieqiBasis).getLunar().getEightChar();
  const yearGz = jieqiEightChar.getYear();
  const monthGz = jieqiEightChar.getMonth();

  // 일주·시주: 보정된 현지 시각으로 판정
  const dayHourEightChar = toSolar(corr.dayHourBasis).getLunar().getEightChar();
  dayHourEightChar.setSect(input.useYaJaSi ? 2 : 1);
  const dayGz = dayHourEightChar.getDay();
  const hourGz = timeKnown ? dayHourEightChar.getTime() : null;

  const dayStem = dayGz[0];
  const pillars = {
    year: buildPillar(yearGz, dayStem),
    month: buildPillar(monthGz, dayStem),
    day: buildPillar(dayGz, dayStem, true),
    hour: hourGz ? buildPillar(hourGz, dayStem) : null,
  };

  const elementCount: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of [pillars.year, pillars.month, pillars.day, pillars.hour]) {
    if (!p) continue;
    elementCount[p.stem.element]++;
    elementCount[p.branch.element]++;
  }

  // 대운
  const yun = jieqiEightChar.getYun(input.gender === "male" ? 1 : 0, 2);
  const luckPillars: LuckPillar[] = yun
    .getDaYun(11)
    .slice(1)
    .map((d) => {
      const gz = d.getGanZhi();
      return {
        ganzhi: ganzhiToHangul(gz),
        hanja: gz,
        startAge: d.getStartAge(),
        endAge: d.getEndAge(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        stemTenGod: tenGod(dayStem, gz[0]),
        branchTenGod: branchTenGod(dayStem, gz[1]),
      };
    });

  // 올해 세운 (입춘 이후 시점으로 올해 간지를 구한다)
  const thisYear = now.getFullYear();
  const yearGanzhi = Solar.fromYmdHms(thisYear, 6, 1, 12, 0, 0).getLunar().getYearInGanZhiExact();
  const current = luckPillars.find((p) => p.startYear <= thisYear && thisYear <= p.endYear) ?? null;

  const notes: string[] = [];
  if (!timeKnown) {
    notes.push("태어난 시간을 몰라 시주 없이 계산했습니다. (년·월·일주는 정오 기준)");
  }
  if (corr.daylightSavingMinutes > 0) {
    notes.push(`출생 당시 서머타임 시행 중이라 ${corr.daylightSavingMinutes}분을 뺐습니다.`);
  }
  if (corr.standardOffsetMinutes === 510) {
    notes.push("출생 당시 한국 표준시는 UTC+8:30(동경 127.5° 기준)이었습니다.");
  }
  if (timeKnown && input.applyTrueSolarTime) {
    notes.push(
      `${input.placeName}(동경 ${input.longitude.toFixed(2)}°) 기준 진태양시로 ${corr.longitudeMinutes}분 보정했습니다.`,
    );
  }
  if (timeKnown) {
    notes.push(
      input.useYaJaSi
        ? "야자시 적용: 밤 11시~자정 출생은 일주를 당일로 유지합니다."
        : "밤 11시부터는 다음 날 일주로 계산합니다. (야자시 미적용)",
    );
  }

  const daySolar = toSolar(corr.dayHourBasis);
  const dayLunar = formatLunar(date.year, date.month, date.day);

  return {
    input,
    solarDate: `양력 ${date.year}년 ${date.month}월 ${date.day}일`,
    lunarDate: dayLunar,
    timeCorrection: {
      clockTime: timeKnown ? formatWall(clock) : null,
      usedTime: timeKnown
        ? formatWall({
            year: daySolar.getYear(),
            month: daySolar.getMonth(),
            day: daySolar.getDay(),
            hour: daySolar.getHour(),
            minute: daySolar.getMinute(),
          })
        : null,
      standardOffsetMinutes: corr.standardOffsetMinutes,
      daylightSavingMinutes: corr.daylightSavingMinutes,
      longitudeMinutes: corr.longitudeMinutes,
      notes,
    },
    pillars,
    dayMaster: stemInfo(dayStem),
    elementCount,
    luck: {
      forward: yun.isForward(),
      startDescription: `${yun.getStartYear()}년 ${yun.getStartMonth()}개월 ${yun.getStartDay()}일`,
      pillars: luckPillars,
      current,
    },
    currentYear: {
      year: thisYear,
      ganzhi: ganzhiToHangul(yearGanzhi),
      hanja: yearGanzhi,
      stemTenGod: tenGod(dayStem, yearGanzhi[0]),
      branchTenGod: branchTenGod(dayStem, yearGanzhi[1]),
      koreanAge: thisYear - date.year + 1,
    },
  };
}
