// lunar-javascript 에는 타입 정의가 없어서, 이 프로젝트에서 쓰는 부분만 선언한다.
declare module "lunar-javascript" {
  export interface DaYun {
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getEndAge(): number;
    getIndex(): number;
    getGanZhi(): string;
  }

  export interface Yun {
    getGender(): number;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    isForward(): boolean;
    getStartSolar(): Solar;
    getDaYun(n?: number): DaYun[];
  }

  export interface EightChar {
    setSect(sect: 1 | 2): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYun(gender: 0 | 1, sect?: 1 | 2): Yun;
  }

  export interface Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getYearInGanZhiExact(): string;
  }

  export interface Solar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getLunar(): Lunar;
    toYmdHms(): string;
  }

  export const Solar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
  };

  export const Lunar: {
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
  };

  export const LunarYear: {
    fromYear(y: number): { getLeapMonth(): number };
  };
}
