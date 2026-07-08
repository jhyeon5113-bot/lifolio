import { Header } from "@/components/Header";
import { currentUser } from "@/lib/mock-data";

const categoryBreakdown = [
  { label: "커리어 & 성장", value: 85, suffix: "성공률", bar: "bg-primary" },
  { label: "학업 / 연구", value: 72, suffix: "성공률", bar: "bg-primary/70" },
  { label: "인간관계", value: 60, suffix: "만족도", bar: "bg-secondary" },
  { label: "소비 / 재무", value: 94, suffix: "효율성", bar: "bg-primary" },
];

const trendPoints = [
  { x: 0, y: 80 },
  { x: 20, y: 75 },
  { x: 40, y: 60 },
  { x: 60, y: 45 },
  { x: 80, y: 30 },
  { x: 100, y: 20 },
];

export default function ReportPage() {
  return (
    <>
      <Header />
      <main className="pt-24 px-6 max-w-container-max mx-auto">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-label-md text-secondary uppercase tracking-widest mb-2 block">
                Personal Analysis Report
              </span>
              <h2 className="text-headline-lg text-primary leading-tight">
                의사결정 인사이트 리포트
              </h2>
              <p className="text-body-lg text-on-surface-variant mt-2">
                데이터로 들여다보는 당신의 삶의 방향성
              </p>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
              <span className="material-symbols-outlined text-[20px]">
                calendar_today
              </span>
              <span className="text-label-md">2023.10.01 - 2024.03.31</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Radar chart */}
          <div className="md:col-span-8 glass-card rounded-3xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-headline-md text-primary">
                  결정 성향 프로필
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  이성, 감성, 단기, 장기 등 6가지 지표 분석
                </p>
              </div>
              <span className="material-symbols-outlined text-primary/40">
                info
              </span>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-8">
              <div className="relative flex items-center justify-center w-48 h-48">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(26,35,126,0.05) 0%, transparent 70%)",
                  }}
                />
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="50" stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" fill="none" r="35" stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" fill="none" r="20" stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" />
                  <line stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" x1="50" x2="50" y1="0" y2="100" />
                  <line stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" x1="6.7" x2="93.3" y1="25" y2="75" />
                  <line stroke="rgba(0,6,102,0.1)" strokeWidth="0.5" x1="6.7" x2="93.3" y1="75" y2="25" />
                  <polygon
                    fill="rgba(26,35,126,0.15)"
                    points="50,15 85,35 75,75 50,85 25,75 15,35"
                    stroke="#000666"
                    strokeWidth="2"
                  />
                </svg>
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-md">이성</span>
                <span className="absolute top-1/4 -right-12 text-label-md">단기</span>
                <span className="absolute bottom-1/4 -right-12 text-label-md">실행</span>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-label-md">감성</span>
                <span className="absolute bottom-1/4 -left-12 text-label-md">계획</span>
                <span className="absolute top-1/4 -left-12 text-label-md">장기</span>
              </div>
              <div className="flex-1 space-y-6 w-full">
                <div className="bg-surface-container-low p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-label-md text-secondary">주요 성향</span>
                    <span className="text-primary font-bold">이성적 장기 계획형</span>
                  </div>
                  <p className="text-body-md text-on-surface-variant">
                    당신은 감정에 휘둘리기보다 데이터와 장기적인 가치를
                    우선시하며, 신중하게 계획을 세우는 경향이 있습니다.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3">
                    <p className="text-label-md text-on-surface-variant">균형 지수</p>
                    <p className="text-headline-md text-primary">82%</p>
                  </div>
                  <div className="text-center p-3 border-l border-outline-variant/20">
                    <p className="text-label-md text-on-surface-variant">일관성</p>
                    <p className="text-headline-md text-primary">매우 높음</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keyword cloud */}
          <div className="md:col-span-4 backdrop-blur-md p-8 rounded-3xl bg-secondary-container/30 shadow-[0_4px_20px_rgba(26,35,126,0.04)] border border-white/30">
            <h3 className="text-headline-md text-secondary mb-6">핵심 가치 키워드</h3>
            <div className="flex flex-wrap gap-3">
              <span className="px-6 py-3 bg-white/80 rounded-full font-bold text-lg text-primary shadow-sm">신중함</span>
              <span className="px-4 py-2 bg-primary/10 rounded-full font-semibold text-primary/80">지속성</span>
              <span className="px-5 py-2.5 bg-white/80 rounded-full font-bold text-md text-secondary shadow-sm">전문성</span>
              <span className="px-4 py-2 bg-secondary/10 rounded-full font-medium text-secondary/70">안정</span>
              <span className="px-8 py-4 bg-primary text-white rounded-full font-extrabold text-xl shadow-md">책임감</span>
              <span className="px-4 py-2 bg-white/80 rounded-full font-semibold text-sm text-on-surface shadow-sm">자기계발</span>
              <span className="px-5 py-2.5 bg-secondary text-white rounded-full font-bold text-md shadow-sm">도전</span>
            </div>
            <p className="mt-8 text-body-md text-on-secondary-container italic">
              &ldquo;당신의 결정들 밑바닥에는 항상 &lsquo;타인에 대한
              책임&rsquo;과 &lsquo;사회적 전문성&rsquo;이라는 두 기둥이 자리
              잡고 있습니다.&rdquo;
            </p>
          </div>

          {/* Velocity metric */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-6 flex-1 shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">speed</span>
                </div>
                <span className="text-label-md text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span> 12% faster
                </span>
              </div>
              <p className="text-label-md text-on-surface-variant mb-1">평균 결정 속도</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl text-primary font-bold">4.2</span>
                <span className="text-label-md text-on-surface-variant">hours</span>
              </div>
              <div className="mt-4 h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "75%" }} />
              </div>
              <p className="mt-3 text-[13px] text-on-surface-variant">
                유사 그룹 대비 결정 속도가 매우 빠른 편입니다.
              </p>
            </div>
          </div>

          {/* Success patterns */}
          <div className="md:col-span-6 glass-card rounded-3xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined fill">verified</span>
              </div>
              <h3 className="text-headline-md text-primary">성공 패턴 인사이트</h3>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <span className="w-2 h-2 rounded-full bg-primary block" />
                </div>
                <div>
                  <h4 className="text-label-md text-primary font-bold mb-1">
                    오전 9시 - 11시 사이의 고도의 집중력
                  </h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    이 시간대에 내린 결정들의 만족도가 가장 높았습니다. 복잡한
                    문제는 가급적 오전 시간에 해결하세요.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1">
                  <span className="w-2 h-2 rounded-full bg-primary block" />
                </div>
                <div>
                  <h4 className="text-label-md text-primary font-bold mb-1">
                    충분한 &lsquo;기록&rsquo; 후의 결정
                  </h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    생각을 글로 300자 이상 정리한 뒤 내린 결정의 92%가
                    성공적인 결과로 이어졌습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning patterns */}
          <div className="md:col-span-6 glass-card rounded-3xl p-8 shadow-[0_4px_20px_rgba(26,35,126,0.04)] border-l-4 border-l-error">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined fill">warning</span>
              </div>
              <h3 className="text-headline-md text-error">주의 패턴 인사이트</h3>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <span className="w-2 h-2 rounded-full bg-error block" />
                </div>
                <div>
                  <h4 className="text-label-md text-error font-bold mb-1">
                    피로도가 높은 심야 시간대
                  </h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    밤 11시 이후에 내린 결정들은 번복될 확률이 40% 이상
                    높았습니다. 중요한 결정은 잠시 미루는 것이 좋습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1">
                  <span className="w-2 h-2 rounded-full bg-error block" />
                </div>
                <div>
                  <h4 className="text-label-md text-error font-bold mb-1">
                    감정적 트리거에 의한 즉흥성
                  </h4>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    &lsquo;불안&rsquo; 감정이 기록된 직후의 결정은 단기적인
                    성향이 강해져 장기적인 목표와 상충하는 경우가
                    빈번했습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="md:col-span-12 lg:col-span-6 glass-card p-8 rounded-3xl shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
            <h3 className="text-headline-md text-primary mb-6">분야별 성과 및 빈도</h3>
            <div className="space-y-5">
              {categoryBreakdown.map((row) => (
                <div key={row.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-on-surface">{row.label}</span>
                    <span className="text-primary">
                      {row.value}% {row.suffix}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.bar}`}
                      style={{ width: `${row.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend chart */}
          <div className="md:col-span-12 glass-card p-8 rounded-3xl shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
            <h3 className="text-headline-md text-primary mb-2">
              의사결정 역량 성장 지표
            </h3>
            <p className="text-on-surface-variant text-sm mb-10">
              지난 6개월간 당신의 결정은 점점 더 단단해지고 있습니다.
            </p>
            <div className="w-full relative pt-8 mt-12">
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
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 100"
                >
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#000666" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#000666" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 80 Q 20 75, 40 60 T 80 30 T 100 20 L 100 100 L 0 100 Z"
                    fill="url(#chartGradient)"
                  />
                  <path
                    d="M 0 80 Q 20 75, 40 60 T 80 30 T 100 20"
                    fill="none"
                    stroke="#000666"
                    strokeWidth="2"
                  />
                  {trendPoints.map((point, index) => (
                    <circle
                      key={point.x}
                      cx={point.x}
                      cy={point.y}
                      r={index === trendPoints.length - 1 ? 3 : 2}
                      fill="#000666"
                      className={index === trendPoints.length - 1 ? "animate-pulse" : ""}
                    />
                  ))}
                </svg>
                <div className="absolute right-0 top-0 -translate-y-full mb-4">
                  <div className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">stars</span>
                    현재: 최적의 균형 (92점)
                  </div>
                  <div className="w-px h-8 bg-primary mx-auto" />
                </div>
              </div>
              <div className="ml-8 mt-4 flex justify-between text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-tighter">
                <span>23 Oct</span>
                <span>23 Nov</span>
                <span>23 Dec</span>
                <span>24 Jan</span>
                <span>24 Feb</span>
                <span>24 Mar</span>
              </div>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/50 p-4 rounded-xl text-center">
                <span className="text-xs text-on-surface-variant font-bold block mb-1">결정 속도</span>
                <span className="text-2xl text-primary font-bold">1.4x Faster</span>
              </div>
              <div className="bg-white/50 p-4 rounded-xl text-center">
                <span className="text-xs text-on-surface-variant font-bold block mb-1">평균 만족도</span>
                <span className="text-2xl text-primary font-bold">+18% Inc</span>
              </div>
              <div className="bg-white/50 p-4 rounded-xl text-center">
                <span className="text-xs text-on-surface-variant font-bold block mb-1">후회 비중</span>
                <span className="text-2xl text-secondary font-bold">-25% Dec</span>
              </div>
            </div>
          </div>

          {/* AI comment */}
          <div className="md:col-span-12 glass-card p-10 rounded-3xl border-2 border-primary/10 shadow-[0_4px_20px_rgba(26,35,126,0.04)]">
            <div className="flex items-start gap-6">
              <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-white text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="text-headline-md text-primary mb-4">Lifolio AI 종합 제언</h3>
                <div className="text-body-lg text-on-surface leading-relaxed space-y-4">
                  <p>
                    {currentUser.name} 님, 지난 6개월간의 데이터를 분석한
                    결과 귀하의 의사결정 방식은{" "}
                    <strong className="text-primary">
                      &lsquo;안정 기반의 점진적 성장형&rsquo;
                    </strong>
                    으로 정의할 수 있습니다. 불확실한 고수익보다는 확실한
                    리스크 관리를 선호하시며, 이러한 경향이 재무와 커리어
                    분야에서 뛰어난 성과로 이어졌습니다.
                  </p>
                  <p>
                    다만,{" "}
                    <span className="bg-secondary-container/50 px-1 rounded">
                      인간관계에서의 만족도
                    </span>
                    는 상대적으로 변동 폭이 컸습니다. 이는 귀하가 지나치게
                    완벽한 논리를 대인관계에 대입하려 할 때 나타나는
                    현상입니다. 가끔은 &lsquo;데이터&rsquo;보다
                    &lsquo;공감&rsquo;에 무게를 둔 직관적인 선택을 허용해
                    보시길 권장합니다.
                  </p>
                  <p className="text-secondary font-bold">
                    💡 다음 달 액션 제언: 주말 저녁에는 &lsquo;계획 없는
                    4시간&rsquo;을 설정해보세요. 무계획이 주는 우연한 기쁨이
                    귀하의 의사결정 역량을 더욱 유연하게 만들어줄 것입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
