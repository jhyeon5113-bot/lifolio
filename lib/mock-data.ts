// Mock content transcribed from the Stitch prototype (lifolio code/*.html).
// TODO: replace with Supabase queries once the decisions/reflections schema ships.

import type {
  ActiveDecision,
  HistoryEntry,
  LibraryCase,
  PendingReflection,
} from "./types";

export const currentUser = {
  name: "박정현",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCPbxoWzK6P87bMGzUzx6vHOrOM4uAZSXf1FuILlzbJtnM5bJcMF9naYz3-QnVE17jnHeY8qCh3sZU_9rYsnSWEVNLTqR2mwP4wijnB0d4jlpeudTCg1qJSMEN8lay-fIok8bsRn3E0xL9HEMWns7rES9O1lmZ4vDPNuLL6Ho_tJK-8t_5jQod4KHTwJmlLrRiyrqXFHu0H6WVy1peaHnWnYrrLKYBtke8CAUpSbyw-oL7Q0fuxzOFS",
};

export const pendingReflection: PendingReflection = {
  id: "leave-of-absence",
  title: "휴학 고민: 진짜 잘한 선택이었을까?",
  daysElapsed: 182,
  choiceSummary: "휴학하고 자기계발 집중하기",
  note: "벌써 반년이 지났네요! 그동안의 변화를 기록하고 마음의 짐을 덜어보세요.",
  decisionLabel: "휴학 선택",
};

export const activeDecisions: ActiveDecision[] = [
  {
    id: "new-project",
    title: "신규 프로젝트 참여",
    description: "하반기 신규 TF팀 참여 여부 및 업무 비중 조절에 대한 고민",
    icon: "work",
    badge: "D-5",
    progress: 65,
    status: "active",
  },
  {
    id: "workout-routine",
    title: "운동 루틴 변경",
    description: "새벽 운동 vs 저녁 운동, 개인 만족도 및 피로도 비교 분석",
    icon: "fitness_center",
    badge: "진행중",
    progress: 30,
    status: "active",
  },
  {
    id: "portfolio",
    title: "자산 포트폴리오 재구성",
    description: "연말 맞이 투자 비중 조절 및 신규 자산군 탐색",
    icon: "savings",
    badge: "대기",
    progress: 5,
    status: "waiting",
  },
];

export const decisionQualityTrend = [40, 60, 55, 85, 45, 70, 90];

export const historyEntries: HistoryEntry[] = [
  {
    id: "global-tech-move",
    date: "2024.03.15",
    tag: "#커리어",
    title: "글로벌 테크 기업 이직 결정",
    context:
      "현재 직장에서의 안정성과 새로운 환경에서의 도전 사이의 갈등. 연봉 상승보다는 전문성 확장 기회를 우선순위에 둠.",
    why: "글로벌 협업 경험은 5년 뒤 나의 시장 가치를 결정짓는 핵심 요소라 판단. 보수적인 문화보다 자율적인 성과 중심 문화를 지향함.",
    outcome:
      "단기적인 피로도는 높으나, 비즈니스 영어 실력과 프로덕트 오너십이 비약적으로 상승함.",
  },
  {
    id: "morning-journaling",
    date: "2024.01.10",
    tag: "#성장",
    title: "매일 아침 30분 명상 및 저널링 루틴 도입",
    context:
      "번아웃 전조 증상과 집중력 저하. 정보 과부하로 인해 정작 중요한 '내 생각'을 할 시간이 부족함을 인지함.",
    why: "의도적인 멈춤 없이는 수동적인 삶에서 벗어날 수 없다는 통찰. 하루의 주도권을 외부 자극이 아닌 스스로 쥐기 위함.",
    outcome:
      "정서적 회복 탄력성이 좋아졌으며, 하루 중 가장 중요한 일 3가지에 집중하는 능력이 향상됨.",
  },
  {
    id: "offline-community",
    date: "2023.11.20",
    tag: "#투자",
    title: "오프라인 지식 커뮤니티 정기 구독",
    context:
      "온라인 강의의 낮은 완강률과 깊이 있는 네트워크 형성의 한계. 비슷한 고민을 하는 동료들과의 실질적인 교류 필요성.",
    why: "단순 지식 습득을 넘어 타인의 관점을 통해 내 편향을 확인하고 싶었음. 강제성이 있는 환경에 나를 노출시키는 투자.",
    outcome:
      "비슷한 가치관을 가진 3명의 멘토를 만났으며, 사이드 프로젝트 팀 구성의 발판이 됨.",
  },
];

export const historyFilters = ["All Log", "#커리어", "#성장", "#관계", "#투자"];

export const libraryFilters = ["전체", "진로/취업", "학업/전공", "인간관계", "창업/도전"];

export const libraryCases: LibraryCase[] = [
  {
    id: "startup-challenge",
    tags: "#창업 #진로",
    title: "공대생의 스타트업 도전기",
    steps: [
      { label: "상황", value: "안정적인 대기업 인턴 합격 상태", dotColor: "bg-secondary-fixed" },
      { label: "고민", value: "성장 속도 vs 심리적 안정감", dotColor: "bg-tertiary-fixed" },
      { label: "선택", value: "인턴 포기 후 친구와 초기 창업", dotColor: "bg-primary-container" },
      { label: "결과", value: "시리즈A 투자 유치 및 실질적 성장", dotColor: "bg-secondary" },
    ],
    authorInitials: "JD",
    authorAvatarColor: "bg-secondary-fixed text-on-secondary-fixed",
    views: "1.2k",
    likes: "84",
  },
  {
    id: "double-major",
    tags: "#학업 #복수전공",
    title: "철학과생의 데이터 분석 복전 고민",
    steps: [
      { label: "상황", value: "인문학적 소양은 있으나 취업 걱정", dotColor: "bg-secondary-fixed" },
      { label: "고민", value: "수학 기초 부족 vs 커리어 확장", dotColor: "bg-tertiary-fixed" },
      { label: "선택", value: "통계학 복수전공 과감히 선택", dotColor: "bg-primary-container" },
      { label: "결과", value: "IT 기업 전략 기획 직무 합격", dotColor: "bg-secondary" },
    ],
    authorInitials: "SO",
    authorAvatarColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    views: "850",
    likes: "120",
  },
  {
    id: "toxic-friend",
    tags: "#인간관계 #거리두기",
    title: "가스라이팅 친구와 인연 끊기",
    steps: [
      { label: "상황", value: "10년 지기 친구의 무례한 태도", dotColor: "bg-secondary-fixed" },
      { label: "고민", value: "추억과 우정 vs 현재의 심리적 피로", dotColor: "bg-tertiary-fixed" },
      { label: "선택", value: "정중하지만 확실한 관계의 종료", dotColor: "bg-primary-container" },
      { label: "결과", value: "자존감 회복 및 건강한 새 인연", dotColor: "bg-secondary" },
    ],
    authorInitials: "ME",
    authorAvatarColor: "bg-primary-fixed-dim text-primary",
    views: "2.4k",
    likes: "312",
  },
];

export const consultQuickTopics = [
  "💼 진로 및 취업 고민",
  "🤝 대인관계 스트레스",
  "❤️ 연애/사랑 문제",
  "📚 학업 및 자격증",
  "🌱 자기계발/습관",
];
