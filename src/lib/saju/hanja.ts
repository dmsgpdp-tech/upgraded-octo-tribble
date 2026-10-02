import type { Element } from "./types";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const STEMS_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const BRANCHES_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

const STEM_ELEMENTS: Element[] = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
const BRANCH_ELEMENTS: Element[] = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];

/** 지장간 (본기를 맨 앞에) */
const HIDDEN_STEMS: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

const ELEMENT_ORDER: Element[] = ["목", "화", "토", "금", "수"];

/** 12운성 순서 */
const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"];
/** 천간별 장생 지지 인덱스 (甲→亥, 乙→午, 丙·戊→寅, 丁·己→酉, 庚→巳, 辛→子, 壬→申, 癸→卯) */
const CHANG_SHENG_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

export function stemIndex(hanja: string): number {
  const i = STEMS.indexOf(hanja as (typeof STEMS)[number]);
  if (i < 0) throw new Error(`알 수 없는 천간: ${hanja}`);
  return i;
}

export function branchIndex(hanja: string): number {
  const i = BRANCHES.indexOf(hanja as (typeof BRANCHES)[number]);
  if (i < 0) throw new Error(`알 수 없는 지지: ${hanja}`);
  return i;
}

export function stemInfo(hanja: string) {
  const i = stemIndex(hanja);
  return {
    hanja,
    hangul: STEMS_KO[i],
    element: STEM_ELEMENTS[i],
    yinYang: (i % 2 === 0 ? "양" : "음") as "양" | "음",
  };
}

export function branchInfo(hanja: string) {
  const i = branchIndex(hanja);
  return {
    hanja,
    hangul: BRANCHES_KO[i],
    element: BRANCH_ELEMENTS[i],
    yinYang: (i % 2 === 0 ? "양" : "음") as "양" | "음",
    hiddenStems: HIDDEN_STEMS[hanja],
  };
}

/** 甲子 → 갑자 */
export function ganzhiToHangul(ganzhi: string): string {
  return stemInfo(ganzhi[0]).hangul + branchInfo(ganzhi[1]).hangul;
}

/** 일간(dayStem)을 기준으로 다른 천간(otherStem)의 십신을 구한다. */
export function tenGod(dayStem: string, otherStem: string): string {
  const me = stemIndex(dayStem);
  const other = stemIndex(otherStem);
  const myEl = ELEMENT_ORDER.indexOf(STEM_ELEMENTS[me]);
  const otherEl = ELEMENT_ORDER.indexOf(STEM_ELEMENTS[other]);
  const samePolarity = me % 2 === other % 2;
  // 상생 순서(목→화→토→금→수)에서 얼마나 떨어져 있는지
  const diff = (otherEl - myEl + 5) % 5;
  switch (diff) {
    case 0:
      return samePolarity ? "비견" : "겁재";
    case 1: // 내가 생하는 것
      return samePolarity ? "식신" : "상관";
    case 2: // 내가 극하는 것
      return samePolarity ? "편재" : "정재";
    case 3: // 나를 극하는 것
      return samePolarity ? "편관" : "정관";
    default: // 나를 생하는 것
      return samePolarity ? "편인" : "정인";
  }
}

/** 지지의 십신은 본기(지장간 첫 글자) 기준 */
export function branchTenGod(dayStem: string, branch: string): string {
  return tenGod(dayStem, HIDDEN_STEMS[branch][0]);
}

/** 일간 기준 12운성 */
export function twelveStage(dayStem: string, branch: string): string {
  const s = stemIndex(dayStem);
  const b = branchIndex(branch);
  const start = CHANG_SHENG_START[s];
  const idx = s % 2 === 0 ? (b - start + 12) % 12 : (start - b + 12) % 12;
  return TWELVE_STAGES[idx];
}
