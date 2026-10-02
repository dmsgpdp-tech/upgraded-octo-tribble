import { describe, expect, test } from "vitest";
import { calculateSaju, SajuInputError } from "../calculate";
import { tenGod, twelveStage } from "../hanja";
import type { SajuInput } from "../types";

const NOW = new Date("2026-10-02T00:00:00Z");

function input(overrides: Partial<SajuInput>): SajuInput {
  return {
    calendar: "solar",
    isLeapMonth: false,
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: "male",
    longitude: 126.978,
    placeName: "서울",
    applyTrueSolarTime: false,
    applyDaylightSaving: true,
    useYaJaSi: false,
    ...overrides,
  };
}

function ganzhi(r: ReturnType<typeof calculateSaju>) {
  const { year, month, day, hour } = r.pillars;
  return [year.hanja, month.hanja, day.hanja, hour?.hanja ?? null];
}

describe("사주팔자 계산", () => {
  test("2000-01-01 정오 → 己卯년 丙子월 戊午일", () => {
    const r = calculateSaju(input({}), NOW);
    expect(ganzhi(r).slice(0, 3)).toEqual(["己卯", "丙子", "戊午"]);
    expect(r.pillars.day.hangul).toBe("무오");
  });

  test("라이브러리 예제(2005-12-23 08:37)와 일치", () => {
    const r = calculateSaju(input({ year: 2005, month: 12, day: 23, hour: 8, minute: 37 }), NOW);
    expect(ganzhi(r)).toEqual(["乙酉", "戊子", "辛巳", "壬辰"]);
  });

  test("입춘 경계: 2024-02-04 입춘(17:27 KST) 전후로 년·월주가 바뀐다", () => {
    const before = calculateSaju(input({ year: 2024, month: 2, day: 4, hour: 17, minute: 0 }), NOW);
    const after = calculateSaju(input({ year: 2024, month: 2, day: 4, hour: 18, minute: 0 }), NOW);
    expect(ganzhi(before).slice(0, 2)).toEqual(["癸卯", "乙丑"]);
    expect(ganzhi(after).slice(0, 2)).toEqual(["甲辰", "丙寅"]);
  });

  test("밤 11시 출생: 야자시 적용 여부에 따라 일주가 달라진다", () => {
    const base = { year: 1988, month: 2, day: 15, hour: 23, minute: 30 };
    const jo = calculateSaju(input({ ...base, useYaJaSi: false }), NOW);
    const ya = calculateSaju(input({ ...base, useYaJaSi: true }), NOW);
    expect(jo.pillars.day.hanja).toBe("辛丑");
    expect(ya.pillars.day.hanja).toBe("庚子");
    expect(jo.pillars.hour?.hanja).toBe("戊子");
    expect(ya.pillars.hour?.hanja).toBe("戊子");
  });

  test("진태양시 보정으로 시주가 바뀐다 (서울 23:20 → 약 22:47)", () => {
    const base = { year: 2000, month: 1, day: 1, hour: 23, minute: 20 };
    const plain = calculateSaju(input(base), NOW);
    const solar = calculateSaju(input({ ...base, applyTrueSolarTime: true }), NOW);
    expect([plain.pillars.day.hanja, plain.pillars.hour?.hanja]).toEqual(["己未", "甲子"]);
    expect([solar.pillars.day.hanja, solar.pillars.hour?.hanja]).toEqual(["戊午", "癸亥"]);
    expect(solar.timeCorrection.longitudeMinutes).toBe(-32);
    expect(solar.timeCorrection.usedTime).toBe("2000-01-01 22:47");
  });

  test("서머타임 기간(1988-07-01)이면 60분을 뺀다", () => {
    const r = calculateSaju(input({ year: 1988, month: 7, day: 1, hour: 10, minute: 0 }), NOW);
    expect(r.timeCorrection.daylightSavingMinutes).toBe(60);
    const off = calculateSaju(input({ year: 1988, month: 7, day: 1, hour: 10, applyDaylightSaving: false }), NOW);
    expect(off.timeCorrection.daylightSavingMinutes).toBe(0);
  });

  test("서머타임으로 시주가 바뀌는 경우 (1988-07-01 09:10 → 08:10, 巳시 → 辰시)", () => {
    const on = calculateSaju(input({ year: 1988, month: 7, day: 1, hour: 9, minute: 10 }), NOW);
    const off = calculateSaju(
      input({ year: 1988, month: 7, day: 1, hour: 9, minute: 10, applyDaylightSaving: false }),
      NOW,
    );
    expect(on.pillars.hour?.branch.hanja).toBe("辰");
    expect(off.pillars.hour?.branch.hanja).toBe("巳");
  });

  test("1954~1961년은 표준시가 UTC+8:30", () => {
    const r = calculateSaju(input({ year: 1958, month: 1, day: 10, hour: 9, minute: 0, applyTrueSolarTime: true }), NOW);
    expect(r.timeCorrection.standardOffsetMinutes).toBe(510);
    // 서울 경도 기준: 126.978 × 4 − 510 ≈ −2분
    expect(r.timeCorrection.longitudeMinutes).toBe(-2);
  });

  test("음력 윤달 입력: 2020년 음력 윤4월 1일 = 양력 2020-05-23", () => {
    const r = calculateSaju(input({ calendar: "lunar", isLeapMonth: true, year: 2020, month: 4, day: 1 }), NOW);
    expect(r.solarDate).toBe("양력 2020년 5월 23일");
    expect(r.lunarDate).toBe("음력 2020년 윤4월 1일");
  });

  test("없는 윤달은 오류", () => {
    expect(() =>
      calculateSaju(input({ calendar: "lunar", isLeapMonth: true, year: 2020, month: 5, day: 1 }), NOW),
    ).toThrow(SajuInputError);
  });

  test("없는 양력 날짜는 오류", () => {
    expect(() => calculateSaju(input({ year: 2023, month: 2, day: 29 }), NOW)).toThrow(SajuInputError);
  });

  test("시간 모름이면 시주 없이 6글자", () => {
    const r = calculateSaju(input({ hour: null, minute: null }), NOW);
    expect(r.pillars.hour).toBeNull();
    const total = Object.values(r.elementCount).reduce((a, b) => a + b, 0);
    expect(total).toBe(6);
  });

  test("대운: 양년 남자는 순행, 여자는 역행", () => {
    // 2000-06-15: 庚辰년(양간), 망종 이후라 월주 壬午
    const male = calculateSaju(input({ year: 2000, month: 6, day: 15 }), NOW);
    const female = calculateSaju(input({ year: 2000, month: 6, day: 15, gender: "female" }), NOW);
    expect(male.luck.forward).toBe(true);
    expect(female.luck.forward).toBe(false);
    // 월주 壬午 → 순행 癸未, 역행 辛巳
    expect(male.pillars.month.hanja).toBe("壬午");
    expect(male.luck.pillars[0].hanja).toBe("癸未");
    expect(female.luck.pillars[0].hanja).toBe("辛巳");
  });

  test("올해(2026) 세운은 丙午", () => {
    const r = calculateSaju(input({}), NOW);
    expect(r.currentYear.hanja).toBe("丙午");
    expect(r.currentYear.koreanAge).toBe(27);
  });
});

describe("십신 / 12운성", () => {
  test("甲 일간 기준 십신", () => {
    expect(tenGod("甲", "甲")).toBe("비견");
    expect(tenGod("甲", "乙")).toBe("겁재");
    expect(tenGod("甲", "丙")).toBe("식신");
    expect(tenGod("甲", "丁")).toBe("상관");
    expect(tenGod("甲", "戊")).toBe("편재");
    expect(tenGod("甲", "己")).toBe("정재");
    expect(tenGod("甲", "庚")).toBe("편관");
    expect(tenGod("甲", "辛")).toBe("정관");
    expect(tenGod("甲", "壬")).toBe("편인");
    expect(tenGod("甲", "癸")).toBe("정인");
  });

  test("12운성", () => {
    expect(twelveStage("甲", "亥")).toBe("장생");
    expect(twelveStage("甲", "卯")).toBe("제왕");
    expect(twelveStage("乙", "午")).toBe("장생");
    expect(twelveStage("乙", "卯")).toBe("건록");
    expect(twelveStage("庚", "午")).toBe("목욕");
  });
});
