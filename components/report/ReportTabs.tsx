"use client";

import { useMemo, useState } from "react";
import type { ReportData } from "@/lib/report-data";
import { generateTraitLabel, generateTraitDescription, type TraitScores } from "@/lib/trait-presentation";
import {
  type DnaLevel,
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  LEVEL_LETTERS,
  getConfidencePercent,
} from "@/lib/dna-level-presentation";

// "실제 선택에는 A가 가장 자주 작용했고, 그 다음은 B, C 순이었어요." style sentence
// from a ranked value-category list, so it reads as prose rather than chips.
function describeValueRanking(ranking: string[]): string {
  if (ranking.length === 0) return "아직 순위를 매길 만큼 데이터가 모이지 않았어요.";
  if (ranking.length === 1) return `실제 선택에는 ${ranking[0]}이(가) 가장 자주 작용했어요.`;
  const [top, ...rest] = ranking;
  return `실제 선택에는 ${top}이(가) 가장 자주 작용했고, 그 다음은 ${rest.join(", ")} 순이었어요.`;
}

const TABS = [
  { id: "level0", label: "Level 0" },
  { id: "level1", label: "Level 1" },
  { id: "level2", label: "Level 2" },
  { id: "level3", label: "Level 3" },
  { id: "level4", label: "Level 4" },
  { id: "level5", label: "Level 5" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// 6-axis hexagon layout. Each complementary pair sits directly opposite the
// other (이성↔감성, 장기↔단기, 계획↔실행) so a lean in one direction always
// reads as "closer to that side of the hexagon."
const TRAIT_AXES = ["이성", "장기", "계획", "감성", "단기", "실행"] as const;
const RADAR_MAX_RADIUS = 40;

function hexPoint(index: number, radius: number): { x: number; y: number } {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}

function pointsAttr(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function traitScores(profile: TraitScores | null): number[] {
  if (!profile) return [50, 50, 50, 50, 50, 50];
  return [profile.rational, profile.longTerm, profile.planned, profile.emotional, profile.shortTerm, profile.executionFocused];
}

function formatShortDate(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatHours(hours: number): string {
  if (hours < 24) return `${hours.toFixed(1)}시간`;
  return `${(hours / 24).toFixed(1)}일`;
}

function LockedLevel({ level, completedCount }: { level: DnaLevel; completedCount: number }) {
  const required = LEVEL_THRESHOLDS[level];
  const remaining = Math.max(0, required - completedCount);
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">lock</span>
      </div>
      <h3 className="text-headline-md text-primary mb-1">{LEVEL_TITLES[level]}</h3>
      <p className="text-label-md text-on-surface-variant/60 mb-6">
        Level {level}은 회고 {required}건부터 열려요
      </p>
      <div className="w-full max-w-xs h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary/30 rounded-full"
          style={{ width: `${Math.min(100, (completedCount / required) * 100)}%` }}
        />
      </div>
      <p className="text-label-sm text-on-surface-variant/60">{remaining > 0 ? `${remaining}건 더 남았어요` : "곧 열려요"}</p>
    </div>
  );
}

export function ReportTabs({ data }: { data: ReportData }) {
  const [activeTab, setActiveTab] = useState<TabId>("level0");
  const {
    categoryBreakdown,
    topCriteria,
    avgHours,
    chooseAgainRate,
    avgSatisfaction,
    dna,
    dnaMeta,
    dnaProgress,
    traitProfile,
    goodDecisions,
    roughDecisions,
    trend,
    completedCount,
  } = data;

  // Only depends on traitProfile, but this component re-renders on every tab
  // click (activeTab state) — memoize so switching to Level 2-5 doesn't
  // redo the hexagon point math for a chart that isn't even showing.
  const { dataPointsAttr, centerPointsAttr, outerHexAttr, midHexAttr, innerHexAttr } = useMemo(() => {
    const scores = traitScores(traitProfile);
    const dataPoints = scores.map((score, i) => hexPoint(i, (score / 100) * RADAR_MAX_RADIUS));
    return {
      dataPointsAttr: pointsAttr(dataPoints),
      centerPointsAttr: pointsAttr(scores.map((_, i) => hexPoint(i, 0))),
      outerHexAttr: pointsAttr(TRAIT_AXES.map((_, i) => hexPoint(i, RADAR_MAX_RADIUS))),
      midHexAttr: pointsAttr(TRAIT_AXES.map((_, i) => hexPoint(i, RADAR_MAX_RADIUS * 0.66))),
      innerHexAttr: pointsAttr(TRAIT_AXES.map((_, i) => hexPoint(i, RADAR_MAX_RADIUS * 0.33))),
    };
  }, [traitProfile]);

  const level0Unlocked = traitProfile !== null;
  const level1Unlocked = dna !== null && dnaMeta !== null;
  const isCurrentTabLocked =
    activeTab === "level0" ? !level0Unlocked : activeTab === "level1" ? !level1Unlocked : true;

  return (
    <div className="glass-card rounded-3xl shadow-[0_4px_20px_rgba(26,35,126,0.04)] overflow-hidden">
      <div className="flex border-b border-outline-variant/20 px-4 md:px-8 overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 md:px-6 py-4 text-label-md whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary font-bold"
                : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isCurrentTabLocked && (
        <p className="text-label-sm text-on-surface-variant/60 px-6 md:px-10 pt-4">
          Lifolio는 충분한 의사결정과 회고가 쌓일수록 더 정확하게 당신의 의사결정 패턴을 이해해요.
        </p>
      )}

      <div className={activeTab === "level1" && level1Unlocked ? "" : "p-6 md:p-10"}>
        {activeTab === "level0" && !level0Unlocked && (
          <div className="flex flex-col items-center text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">lock</span>
            </div>
            <h3 className="text-headline-md text-primary mb-1">첫 결정을 완료하면 열려요</h3>
            <p className="text-label-md text-on-surface-variant">결정을 하나만 마쳐도 성향과 카테고리 분석이 시작돼요.</p>
          </div>
        )}

        {activeTab === "level0" && level0Unlocked && (
          <div className="space-y-12">
            <div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-headline-md text-primary">결정 성향 프로필</h3>
                  <p className="text-body-md text-on-surface-variant">결정 데이터를 기반으로 분석한 나의 성향</p>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-4">
                <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(26,35,126,0.05) 0%, transparent 70%)" }}
                  />
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                    <polygon points={outerHexAttr} fill="none" stroke="rgba(0,6,102,0.12)" strokeWidth="0.5" />
                    <polygon points={midHexAttr} fill="none" stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                    <polygon points={innerHexAttr} fill="none" stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                    {TRAIT_AXES.map((_, i) => {
                      const outer = hexPoint(i, RADAR_MAX_RADIUS);
                      return (
                        <line key={i} x1="50" y1="50" x2={outer.x} y2={outer.y} stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                      );
                    })}
                    <polygon fill="rgba(26,35,126,0.15)" points={dataPointsAttr} stroke="#000666" strokeWidth="2">
                      <animate
                        attributeName="points"
                        from={centerPointsAttr}
                        to={dataPointsAttr}
                        dur="0.8s"
                        calcMode="spline"
                        keySplines="0.25 0.1 0.25 1"
                        keyTimes="0;1"
                        fill="freeze"
                      />
                    </polygon>
                    {TRAIT_AXES.map((label, i) => {
                      const pos = hexPoint(i, RADAR_MAX_RADIUS + 8);
                      return (
                        <text key={label} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="6" fill="#000666" opacity="0.7">
                          {label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex-1 space-y-6 w-full">
                  <div className="bg-surface-container-low p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-label-md text-secondary">주요 성향</span>
                    </div>
                    {traitProfile ? (
                      <>
                        <p className="text-headline-md text-primary font-bold mb-1">{generateTraitLabel(traitProfile)}</p>
                        <p className="text-body-md text-on-surface-variant">{generateTraitDescription(traitProfile)}</p>
                      </>
                    ) : (
                      <p className="text-body-md text-on-surface-variant">
                        아직 결정 데이터가 없어요. 첫 결정을 내리면 성향 프로필이 시작돼요.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3">
                      <p className="text-label-md text-on-surface-variant">평균 만족도</p>
                      <p className="text-headline-md text-primary">{avgSatisfaction !== null ? `${avgSatisfaction}%` : "-"}</p>
                    </div>
                    <div className="text-center p-3 border-l border-outline-variant/20">
                      <p className="text-label-md text-on-surface-variant">다시 선택할 확률</p>
                      <p className="text-headline-md text-primary">{chooseAgainRate !== null ? `${chooseAgainRate}%` : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-secondary-container/30 rounded-2xl p-6 border border-white/30">
                  <h3 className="text-headline-md text-secondary mb-6">핵심 가치 키워드</h3>
                  {topCriteria.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {topCriteria.map(([term, count], index) => (
                        <span
                          key={term}
                          className={`rounded-full font-bold shadow-sm ${
                            index === 0
                              ? "px-8 py-4 bg-primary text-white text-xl shadow-md font-extrabold"
                              : index < 3
                                ? "px-6 py-3 bg-white/80 text-primary text-lg"
                                : "px-4 py-2 bg-white/60 text-secondary text-sm font-semibold"
                          }`}
                        >
                          {term} {count > 1 ? `(${count})` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-md text-on-secondary-container/70">아직 판단 기준 데이터가 없어요.</p>
                  )}
                  {dna && (
                    <p className="mt-8 text-body-md text-on-secondary-container italic">
                      &ldquo;가장 자주 등장한 불안 요소는 &lsquo;{dna.mostCommonConcern || "아직 없음"}&rsquo;입니다.&rdquo;
                    </p>
                  )}
                </div>

                <div className="md:col-span-5 bg-surface-container-low rounded-2xl p-6">
                  <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                  <p className="text-label-md text-on-surface-variant mb-1">평균 결정 속도</p>
                  <p className="text-4xl text-primary font-bold">{avgHours !== null ? formatHours(avgHours) : "-"}</p>
                  <p className="mt-3 text-[13px] text-on-surface-variant">
                    {avgHours !== null ? "고민을 시작한 뒤 최종 선택까지 걸린 평균 시간입니다." : "아직 최종 선택을 마친 결정이 없어요."}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-headline-md text-primary mb-6">분야별 성과 및 빈도</h3>
                {categoryBreakdown.length > 0 ? (
                  <div className="space-y-5">
                    {categoryBreakdown.map((row) => (
                      <div key={row.label} className="space-y-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-on-surface">{row.label}</span>
                          <span className="text-primary">{row.hasSatisfaction ? `${row.value}% ${row.suffix}` : row.suffix}</span>
                        </div>
                        <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.hasSatisfaction ? row.value : 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant">아직 기록된 결정이 없어요.</p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-headline-md text-primary mb-2">만족도 추이</h3>
                <p className="text-on-surface-variant text-sm mb-10">회고를 남길 때마다 만족도 변화가 여기에 쌓여요.</p>
                {trend.length >= 2 ? (
                  <div className="w-full relative pt-8 mt-4">
                    <div className="absolute left-0 top-8 bottom-0 flex flex-col justify-between text-[10px] text-on-surface-variant/40 font-bold pr-2 border-r border-outline-variant/20">
                      <span>100</span>
                      <span>75</span>
                      <span>50</span>
                      <span>25</span>
                      <span>0</span>
                    </div>
                    <div className="ml-8 h-48 relative">
                      <div className="absolute inset-0 flex flex-col justify-between">
                        <div className="w-full border-t border-outline-variant/10" />
                        <div className="w-full border-t border-outline-variant/10" />
                        <div className="w-full border-t border-outline-variant/10" />
                        <div className="w-full border-t border-outline-variant/10" />
                        <div className="w-full border-t border-outline-variant/20" />
                      </div>
                      <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#000666" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#000666" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {(() => {
                          const points = trend.map((t, i) => ({ x: (i / (trend.length - 1)) * 100, y: 100 - t.satisfaction }));
                          const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                          const areaPath = `${linePath} L 100 100 L 0 100 Z`;
                          return (
                            <>
                              <path d={areaPath} fill="url(#chartGradient)" />
                              <path d={linePath} fill="none" stroke="#000666" strokeWidth="2" />
                              {points.map((p, i) => (
                                <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 3 : 2} fill="#000666" className={i === points.length - 1 ? "animate-pulse" : ""} />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div className="ml-8 mt-4 flex justify-between text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter">
                      {trend.map((t, i) => (
                        <span key={i}>{formatShortDate(t.date)}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-body-md text-on-surface-variant">회고가 2건 이상 쌓이면 추이 그래프를 볼 수 있어요.</p>
                )}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-surface-container-low p-4 rounded-xl text-center">
                    <span className="text-xs text-on-surface-variant font-bold block mb-1">평균 결정 속도</span>
                    <span className="text-2xl text-primary font-bold">{avgHours !== null ? formatHours(avgHours) : "-"}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl text-center">
                    <span className="text-xs text-on-surface-variant font-bold block mb-1">평균 만족도</span>
                    <span className="text-2xl text-primary font-bold">{avgSatisfaction !== null ? `${avgSatisfaction}%` : "-"}</span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl text-center">
                    <span className="text-xs text-on-surface-variant font-bold block mb-1">다시 선택 의향</span>
                    <span className="text-2xl text-secondary font-bold">{chooseAgainRate !== null ? `${chooseAgainRate}%` : "-"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-4 border-l-primary pl-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined fill">verified</span>
                    </div>
                    <h3 className="text-headline-md text-primary">만족도 높았던 결정</h3>
                  </div>
                  {goodDecisions.length > 0 ? (
                    <div className="space-y-6">
                      {goodDecisions.map((d) => (
                        <div key={d.id} className="flex gap-4">
                          <div className="mt-1">
                            <span className="w-2 h-2 rounded-full bg-primary block" />
                          </div>
                          <div>
                            <h4 className="text-label-md text-primary font-bold mb-1">
                              {d.title} (만족도 {d.satisfaction}%)
                            </h4>
                            <p className="text-body-md text-on-surface-variant leading-relaxed">{d.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-md text-on-surface-variant">아직 만족도가 높았던 회고가 없어요.</p>
                  )}
                </div>

                <div className="border-l-4 border-l-error pl-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined fill">warning</span>
                    </div>
                    <h3 className="text-headline-md text-error">아쉬웠던 결정</h3>
                  </div>
                  {roughDecisions.length > 0 ? (
                    <div className="space-y-6">
                      {roughDecisions.map((d) => (
                        <div key={d.id} className="flex gap-4">
                          <div className="mt-1">
                            <span className="w-2 h-2 rounded-full bg-error block" />
                          </div>
                          <div>
                            <h4 className="text-label-md text-error font-bold mb-1">
                              {d.title} (만족도 {d.satisfaction}%)
                            </h4>
                            <p className="text-body-md text-on-surface-variant leading-relaxed">{d.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-md text-on-surface-variant">아직 아쉬웠던 회고가 없어요.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "level1" && !dna && (
          <div className="flex flex-col items-center text-center py-16 px-6">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">lock</span>
            </div>
            <h3 className="text-headline-md text-primary mb-1">{LEVEL_TITLES[1]}</h3>
            <p className="text-label-md text-on-surface-variant/60 mb-6">
              Level 1은 회고 {LEVEL_THRESHOLDS[1]}건부터 열려요
            </p>
            <div className="w-full max-w-xs h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary/30 rounded-full"
                style={{ width: `${Math.min(100, ((dnaProgress?.completedCount ?? completedCount) / LEVEL_THRESHOLDS[1]) * 100)}%` }}
              />
            </div>
            <p className="text-label-sm text-on-surface-variant/60">
              {Math.max(0, LEVEL_THRESHOLDS[1] - (dnaProgress?.completedCount ?? completedCount)) > 0
                ? `${Math.max(0, LEVEL_THRESHOLDS[1] - (dnaProgress?.completedCount ?? completedCount))}건 더 남았어요`
                : "곧 열려요"}
            </p>
          </div>
        )}

        {activeTab === "level1" && dna && dnaMeta && (
          <div
            style={{
              background: "#0a0f2c",
              borderRadius: "0 0 24px 24px",
              padding: "24px 20px",
              fontFamily: "var(--font-sans, inherit)",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em", color: "#f5e0c1" }}>
              LEVEL 01 · DECISION DNA
            </span>
            <p style={{ margin: "8px 0 2px", fontSize: "13px", fontWeight: 600, color: "#e3e5f5" }}>
              Lifolio가 당신을 이해한 정도: {getConfidencePercent(1)}%
            </p>
            <h3 style={{ margin: "14px 0 22px", fontSize: "22px", fontWeight: 800, color: "#fdf9f0", lineHeight: 1.3 }}>
              {LEVEL_TITLES[1]}
            </h3>

            {(
              [
                { label: "나도 몰랐던 나", body: dna.valueGapInsight },
                { label: "숨겨진 결정 기준", body: describeValueRanking(dna.hiddenValueRanking) },
                { label: "후회를 만드는 요소", body: dna.regretDriverInsight },
                { label: "가장 놀라운 발견", body: dna.surprisingInsight },
              ] as const
            ).map((item, i, arr) => (
              <div key={item.label} style={{ position: "relative", paddingLeft: "22px", marginBottom: i === arr.length - 1 ? 0 : "20px" }}>
                {i !== arr.length - 1 && (
                  <div style={{ position: "absolute", left: "6px", top: "20px", bottom: "-20px", width: "1px", background: "#262b52" }} />
                )}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "1px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#1a1440",
                    border: "0.5px solid #d4af7a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "8px",
                    fontWeight: 700,
                    color: "#d4af7a",
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ margin: "0 0 5px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", color: "#d4af7a" }}>
                  {item.label}
                </p>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.75, color: "#c7cae8" }}>{item.body}</p>
              </div>
            ))}

            {(() => {
              const [greetingBlock, ...bodyBlocks] = LEVEL_LETTERS[1].split("\n\n");
              const [greetingLine, ...restOfGreeting] = greetingBlock.split("\n");
              return (
                <div
                  style={{
                    marginTop: "24px",
                    padding: "16px",
                    background: "#12173a",
                    borderLeft: "2px solid #d4af7a",
                    borderRadius: "0 12px 12px 0",
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.08em", color: "#d4af7a" }}>
                    Lifolio의 편지
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: "14.5px", fontWeight: 700, color: "#fdf9f0", lineHeight: 1.5 }}>
                    {greetingLine}
                  </p>
                  {restOfGreeting.map((line) => (
                    <p key={line} style={{ margin: "0 0 10px", fontSize: "13px", lineHeight: 1.75, color: "#e3e5f5" }}>
                      {line}
                    </p>
                  ))}
                  {bodyBlocks.map((block, i) => (
                    <p
                      key={block}
                      style={{ margin: i === bodyBlocks.length - 1 ? 0 : "0 0 10px", fontSize: "13px", lineHeight: 1.75, color: "#e3e5f5" }}
                    >
                      {block}
                    </p>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === "level2" && <LockedLevel level={2} completedCount={completedCount} />}
        {activeTab === "level3" && <LockedLevel level={3} completedCount={completedCount} />}
        {activeTab === "level4" && <LockedLevel level={4} completedCount={completedCount} />}
        {activeTab === "level5" && <LockedLevel level={5} completedCount={completedCount} />}
      </div>
    </div>
  );
}
