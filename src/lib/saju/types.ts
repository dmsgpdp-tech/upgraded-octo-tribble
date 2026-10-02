export type Gender = "male" | "female";

export interface SajuInput {
  calendar: "solar" | "lunar";
  /** 음력 입력일 때 윤달 여부 */
  isLeapMonth: boolean;
  year: number;
  month: number;
  day: number;
  /** 태어난 시간을 모르면 null */
  hour: number | null;
  minute: number | null;
  gender: Gender;
  /** 출생지 경도 (진태양시 보정용) */
  longitude: number;
  /** 출생지 이름 (표시용) */
  placeName: string;
  applyTrueSolarTime: boolean;
  applyDaylightSaving: boolean;
  /** true: 밤 11시~자정 출생은 일주를 당일로 유지 (야자시). false: 밤 11시부터 다음 날 일주 */
  useYaJaSi: boolean;
}

export type Element = "목" | "화" | "토" | "금" | "수";

export interface Pillar {
  /** 한자 간지, 예: 甲子 */
  hanja: string;
  /** 한글 간지, 예: 갑자 */
  hangul: string;
  stem: { hanja: string; hangul: string; element: Element; yinYang: "양" | "음"; tenGod: string };
  branch: {
    hanja: string;
    hangul: string;
    element: Element;
    yinYang: "양" | "음";
    /** 지지 본기 기준 십신 */
    tenGod: string;
    /** 지장간 (한글) */
    hiddenStems: string[];
    /** 12운성 */
    twelveStage: string;
  };
}

export interface LuckPillar {
  ganzhi: string;
  hanja: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  stemTenGod: string;
  branchTenGod: string;
}

export interface SajuResult {
  input: SajuInput;
  /** 입력한 날짜의 양력 표기 */
  solarDate: string;
  /** 입력한 날짜의 음력 표기 */
  lunarDate: string;
  /** 시간 보정 설명 */
  timeCorrection: {
    /** 입력한 시계 시각 */
    clockTime: string | null;
    /** 사주 계산에 실제 쓴 시각 (일주/시주 기준) */
    usedTime: string | null;
    /** 출생 당시 한국 표준시 UTC 오프셋 (분) */
    standardOffsetMinutes: number;
    /** 서머타임으로 빠진 분 (0이면 해당 없음) */
    daylightSavingMinutes: number;
    /** 경도 보정 분 */
    longitudeMinutes: number;
    notes: string[];
  };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  dayMaster: { hanja: string; hangul: string; element: Element; yinYang: "양" | "음" };
  /** 오행 개수 (천간 + 지지 본기) */
  elementCount: Record<Element, number>;
  luck: {
    /** 대운이 순행인지 */
    forward: boolean;
    /** 대운수 설명, 예: "3년 4개월 10일" */
    startDescription: string;
    pillars: LuckPillar[];
    /** 올해 기준 현재 대운 (없으면 null) */
    current: LuckPillar | null;
  };
  currentYear: {
    year: number;
    ganzhi: string;
    hanja: string;
    stemTenGod: string;
    branchTenGod: string;
    /** 한국식 나이 */
    koreanAge: number;
  };
}
