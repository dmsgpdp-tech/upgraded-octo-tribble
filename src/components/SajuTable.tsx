import type { Element, Pillar, SajuResult } from "@/lib/saju/types";

const ELEMENT_STYLE: Record<Element, string> = {
  목: "bg-emerald-600 text-white",
  화: "bg-rose-600 text-white",
  토: "bg-amber-500 text-white",
  금: "bg-slate-300 text-slate-900",
  수: "bg-slate-800 text-white",
};

function Char({ hanja, hangul, element }: { hanja: string; hangul: string; element: Element }) {
  return (
    <div className={`mx-auto flex h-16 w-16 flex-col items-center justify-center rounded-xl ${ELEMENT_STYLE[element]}`}>
      <span className="text-2xl leading-none font-bold">{hanja}</span>
      <span className="mt-1 text-xs opacity-90">
        {hangul}·{element}
      </span>
    </div>
  );
}

function PillarColumn({ label, pillar }: { label: string; pillar: Pillar | null }) {
  return (
    <div className="space-y-2 text-center">
      <div className="text-sm text-[var(--muted)]">{label}</div>
      {pillar ? (
        <>
          <div className="text-xs font-medium">{pillar.stem.tenGod}</div>
          <Char {...pillar.stem} />
          <Char {...pillar.branch} />
          <div className="text-xs font-medium">{pillar.branch.tenGod}</div>
          <div className="text-xs text-[var(--muted)]">{pillar.branch.hiddenStems.join(" ")}</div>
          <div className="text-xs text-[var(--muted)]">{pillar.branch.twelveStage}</div>
        </>
      ) : (
        <div className="flex h-[8.5rem] items-center justify-center text-sm text-[var(--muted)]">모름</div>
      )}
    </div>
  );
}

export default function SajuTable({ saju }: { saju: SajuResult }) {
  const { pillars, timeCorrection: tc, luck, currentYear } = saju;
  const thisYear = currentYear.year;

  return (
    <section className="space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
      <div className="text-sm text-[var(--muted)]">
        {saju.solarDate} · {saju.lunarDate}
        {tc.clockTime && (
          <>
            <br />
            입력 시각 {tc.clockTime.slice(11)} → 계산 시각 {tc.usedTime}
          </>
        )}
      </div>

      {/* 사주는 전통적으로 오른쪽부터 년·월·일·시 순서로 읽는다 */}
      <div className="grid grid-cols-4 gap-2">
        <PillarColumn label="시주" pillar={pillars.hour} />
        <PillarColumn label="일주" pillar={pillars.day} />
        <PillarColumn label="월주" pillar={pillars.month} />
        <PillarColumn label="년주" pillar={pillars.year} />
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {(Object.entries(saju.elementCount) as [Element, number][]).map(([el, n]) => (
          <span key={el} className={`rounded-full px-3 py-1 ${ELEMENT_STYLE[el]}`}>
            {el} {n}
          </span>
        ))}
      </div>

      {tc.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
          {tc.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}

      <div>
        <div className="mb-2 text-sm font-medium">
          대운 <span className="text-[var(--muted)]">({luck.forward ? "순행" : "역행"}, 대운수 {luck.startDescription})</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {luck.pillars.map((p) => {
            const isCurrent = p.startYear <= thisYear && thisYear <= p.endYear;
            return (
              <div
                key={p.startYear}
                className={`min-w-[3.5rem] rounded-lg border px-1 py-2 text-center text-xs ${
                  isCurrent ? "border-[var(--accent)] font-bold" : "border-[var(--line)]"
                }`}
              >
                <div className="text-[var(--muted)]">{p.startAge}세</div>
                <div className="text-base">{p.hanja}</div>
                <div>{p.ganzhi}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-[var(--muted)]">
          {thisYear}년 세운: {currentYear.hanja}({currentYear.ganzhi}) · 한국 나이 {currentYear.koreanAge}세
        </div>
      </div>
    </section>
  );
}
