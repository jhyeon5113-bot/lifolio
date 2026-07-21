// Rule-based placeholder for `AIProvider`. No external API calls.
//
// Deliberately does the *minimum* honest thing rather than faking
// intelligence: it never invents criteria/concerns/options the user didn't
// write, so downstream missing-info detection correctly asks for whatever
// this stub couldn't extract. Swap in a real provider by adding a new file
// next to this one and pointing `lib/ai/index.ts` at it.

import type {
  AIProvider,
  DecisionCategory,
  DecisionDnaInput,
  DecisionDnaLevel1Output,
  DecisionStructureInput,
  DecisionStructureOutput,
  DecisionSummaryInput,
  DecisionSummaryOutput,
  DecisionTraitInput,
  DecisionTraitOutput,
  MissingInfoInput,
  MissingInfoOutput,
  NormalizeTermInput,
  NormalizeTermOutput,
  ReflectionAnalysisInput,
  ReflectionAnalysisOutput,
  SimilarityExplanationInput,
  SimilarityExplanationOutput,
} from "./types";
import { GOOD_DECISION_SATISFACTION_THRESHOLD } from "@/lib/satisfaction-thresholds";

const CRITERIA_CHOICES = ["성장", "취업", "돈", "경험", "인간관계", "안정성"];

// Coarse value taxonomy used only by analyzeDecisionDnaLevel1 to compare
// what a user *says* matters (criteria they typed) against what actually
// went well for them (criteria attached to high-satisfaction decisions).
// A criterion that matches no keyword is simply excluded from the
// category ranking rather than guessed at.
const VALUE_CATEGORIES: Record<string, string[]> = {
  성장: ["성장", "도전", "커리어", "실력", "발전", "역량"],
  안정: ["안정", "안전", "확실", "편안"],
  경험: ["경험", "새로운", "다양"],
  관계: ["관계", "가족", "친구", "사람"],
  돈: ["돈", "비용", "수입", "재정", "경제", "취업"],
};

function classifyValue(term: string): string | null {
  for (const [category, keywords] of Object.entries(VALUE_CATEGORIES)) {
    if (keywords.some((keyword) => term.includes(keyword))) return category;
  }
  return null;
}

const NORMALIZATION_MAP: Record<string, string> = {
  돈: "경제적 안정",
  스펙: "취업 경쟁력",
  "경험 많이 하고 싶어요": "성장",
};

const CATEGORY_KEYWORDS: Record<DecisionCategory, string[]> = {
  "진로/취업": ["취업", "인턴", "이직", "커리어", "직무"],
  "학업/전공": ["전공", "복수전공", "휴학", "교환학생", "대학원", "학점"],
  "창업/도전": ["창업", "사업", "스타트업"],
};

const LONG_TERM_KEYWORDS = ["미래", "장기", "커리어", "평생", "인생", "졸업 후", "취업 후", "몇 년"];
const SHORT_TERM_KEYWORDS = ["당장", "이번 학기", "급하게", "지금 당장", "단기", "이번 주", "이번 달"];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function guessCategory(text: string): DecisionCategory | undefined {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    DecisionCategory,
    string[],
  ][]) {
    if (keywords.some((keyword) => text.includes(keyword))) return category;
  }
  return undefined;
}

// Looks for "A vs B" / "A 또는 B" / "A, B 중" style phrasing. Falls back to
// an empty list — the missing-info step will ask the user directly rather
// than have the stub guess at options it can't confidently find.
function guessOptions(text: string): string[] {
  const vsMatch = text.match(/([가-힣a-zA-Z0-9]+)\s*(?:vs\.?|또는)\s*([가-힣a-zA-Z0-9]+)/);
  if (vsMatch) return [vsMatch[1], vsMatch[2]];
  return [];
}

export const stubProvider: AIProvider = {
  async structureDecision({ rawInput }: DecisionStructureInput): Promise<DecisionStructureOutput> {
    return {
      category: guessCategory(rawInput),
      background: "",
      situation: rawInput.trim(),
      options: guessOptions(rawInput),
      criteria: [],
      concerns: [],
    };
  },

  async detectMissingInfo(input: MissingInfoInput): Promise<MissingInfoOutput> {
    // One question at a time, in a fixed order. The caller re-runs this
    // after every answer with the full current field state, so an answer
    // that happens to fill more than one field is never re-asked.
    if (!input.background.trim()) {
      return {
        field: "background",
        question: "함께 생각을 정리해볼게요. 우선 왜 이 고민을 하게 되었는지부터 알려주세요. 어떤 일이 있었나요?",
        inputType: "text",
      };
    }
    if (!input.situation.trim()) {
      return {
        field: "situation",
        question: "지금 상황을 조금 더 구체적으로 알려주시겠어요?",
        inputType: "text",
      };
    }
    if (input.options.length < 2) {
      return {
        field: "options",
        question: "지금 고려하고 있는 선택지들은 무엇인가요?",
        inputType: "list",
      };
    }
    if (input.concerns.length === 0) {
      return {
        field: "concerns",
        question: "결정을 망설이게 만드는 가장 큰 이유는 무엇인가요?",
        inputType: "text",
      };
    }
    if (input.criteria.length === 0) {
      return {
        field: "criteria",
        question: "이번 선택에서 가장 중요하게 생각하는 것은 무엇인가요?",
        inputType: "choice",
        choices: CRITERIA_CHOICES,
      };
    }

    return null;
  },

  async summarizeDecision(input: DecisionSummaryInput): Promise<DecisionSummaryOutput> {
    const optionsText =
      input.options.length >= 2 ? input.options.join(" 또는 ") : (input.options[0] ?? "");
    const criteriaText =
      input.criteria.length > 0 ? `${input.criteria.join(", ")}을(를) 가장 중요하게 생각하고 계시고, ` : "";
    const concernsText =
      input.concerns.length > 0 ? `${input.concerns.join(", ")}이(가) 가장 걱정되는 부분이시네요.` : "";

    const summary = `${input.situation} ${optionsText} 사이에서 고민하고 계시는군요. ${criteriaText}${concernsText}`
      .replace(/\s+/g, " ")
      .trim();

    return { summary };
  },

  async normalizeTerm({ term }: NormalizeTermInput): Promise<NormalizeTermOutput> {
    return { normalized: NORMALIZATION_MAP[term] ?? term };
  },

  async explainSimilarity(
    input: SimilarityExplanationInput,
  ): Promise<SimilarityExplanationOutput> {
    const sharedCriteria = input.userCriteria.find((c) => input.caseCriteria.includes(c));
    if (sharedCriteria) {
      return { reason: `${sharedCriteria}을(를) 가장 중요하게 생각했던 사람들의 경험입니다.` };
    }
    const sharedConcern = input.userConcerns.find((c) => input.caseConcerns.includes(c));
    if (sharedConcern) {
      return { reason: `비슷한 ${sharedConcern} 고민을 했던 사례입니다.` };
    }
    return { reason: "비슷한 상황에 있었던 사람의 경험입니다." };
  },

  async analyzeReflection(input: ReflectionAnalysisInput): Promise<ReflectionAnalysisOutput> {
    if (!input.expectedPositive) {
      return { summary: input.actualVsExpected.slice(0, 60) };
    }
    return {
      summary: `처음에는 "${input.expectedPositive}"을(를) 가장 기대했지만, 실제로는 "${input.actualVsExpected.slice(0, 40)}"에서 만족을 얻었습니다.`,
    };
  },

  async analyzeDecisionDnaLevel1(input: DecisionDnaInput): Promise<DecisionDnaLevel1Output> {
    const { completedDecisions } = input;
    const criteriaCounts = new Map<string, number>();
    const concernCounts = new Map<string, number>();
    const statedValueCounts = new Map<string, number>();
    const revealedValueCounts = new Map<string, number>();
    let satisfactionSum = 0;
    let chooseAgainYes = 0;

    const sortedHours = [...completedDecisions].map((d) => d.decisionHours).sort((a, b) => a - b);
    const medianHours = sortedHours.length > 0 ? sortedHours[Math.floor(sortedHours.length / 2)] : 0;
    let shortCount = 0;
    let shortRegretCount = 0;
    let longCount = 0;
    let longRegretCount = 0;

    for (const decision of completedDecisions) {
      for (const criterion of decision.criteria) {
        criteriaCounts.set(criterion, (criteriaCounts.get(criterion) ?? 0) + 1);
        const category = classifyValue(criterion);
        if (category) statedValueCounts.set(category, (statedValueCounts.get(category) ?? 0) + 1);
      }
      for (const concern of decision.concerns) {
        concernCounts.set(concern, (concernCounts.get(concern) ?? 0) + 1);
      }
      satisfactionSum += decision.satisfaction;
      if (decision.wouldChooseAgain === "YES") chooseAgainYes += 1;

      const wentWell =
        decision.satisfaction >= GOOD_DECISION_SATISFACTION_THRESHOLD || decision.wouldChooseAgain === "YES";
      if (wentWell) {
        for (const criterion of decision.criteria) {
          const category = classifyValue(criterion);
          if (category) revealedValueCounts.set(category, (revealedValueCounts.get(category) ?? 0) + 1);
        }
      }

      const regretted = decision.satisfaction < 50 || decision.wouldChooseAgain === "NO";
      if (decision.decisionHours <= medianHours) {
        shortCount += 1;
        if (regretted) shortRegretCount += 1;
      } else {
        longCount += 1;
        if (regretted) longRegretCount += 1;
      }
    }

    const topValue = [...criteriaCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const mostCommonConcern =
      [...concernCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const count = completedDecisions.length || 1;
    const averageSatisfaction = Math.round((satisfactionSum / count) * 10) / 10;
    const wouldChooseAgainRate = Math.round((chooseAgainYes / count) * 100) / 100;

    const hiddenValueRanking = [...revealedValueCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const statedTopCategory = [...statedValueCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const revealedTopCategory = hiddenValueRanking[0] ?? null;
    const revealedValue = revealedTopCategory ?? topValue;
    const hasGap = Boolean(statedTopCategory && revealedTopCategory && statedTopCategory !== revealedTopCategory);

    const valueGapInsight = hasGap
      ? `당신은 ${statedTopCategory}을(를) 가장 중요하게 생각한다고 말했지만, 실제로 만족도가 높았던 결정에서는 ${revealedTopCategory}이(가) 더 자주 작용했습니다.`
      : statedTopCategory
        ? `말한 기준과 실제 선택이 일치했습니다. 당신은 ${statedTopCategory}을(를) 말과 행동 모두에서 일관되게 우선시하고 있어요.`
        : "아직 패턴을 비교하기엔 회고 데이터가 더 필요합니다.";

    const shortRate = shortCount > 0 ? shortRegretCount / shortCount : null;
    const longRate = longCount > 0 ? longRegretCount / longCount : null;
    const regretDriverInsight =
      shortRate !== null && longRate !== null && shortRate !== longRate
        ? shortRate > longRate
          ? "충분히 고민하지 못한 결정일수록 후회가 컸습니다. 결정을 서두르기 전에 하루 정도 시간을 두는 것만으로도 만족도가 달라질 수 있어요."
          : "오래 고민했다고 후회가 적지는 않았습니다. 고민의 길이보다 기준이 얼마나 명확했는지가 더 중요했어요."
        : "아직 고민 시간과 후회의 관계를 판단하기엔 데이터가 더 필요합니다.";

    const surprisingInsight = hasGap
      ? `${revealedTopCategory}을(를) 택했을 때 후회가 가장 적었다는 사실, 스스로도 몰랐을 거예요.`
      : topValue
        ? `당신은 최근 결정에서 ${topValue}을(를) 가장 자주 판단 기준으로 삼았습니다.`
        : "아직 패턴을 발견하기엔 회고 데이터가 더 필요합니다.";

    return {
      topValue,
      mostCommonConcern,
      averageSatisfaction,
      wouldChooseAgainRate,
      aiInsight: surprisingInsight,
      revealedValue,
      valueGapInsight,
      hiddenValueRanking,
      regretDriverInsight,
      surprisingInsight,
    };
  },

  async analyzeDecisionTraits(input: DecisionTraitInput): Promise<DecisionTraitOutput> {
    // 이성/감성: more stated criteria (explicit reasoning) leans rational;
    // more stated concerns (anxiety) leans emotional.
    const rational = clamp(50 + input.criteria.length * 8 - input.concerns.length * 4);

    // 장기/단기: simple keyword match over the decision's own text — no
    // invented signal, just what the user actually wrote.
    const text = `${input.background} ${input.situation} ${input.concerns.join(" ")} ${input.criteria.join(" ")}`;
    const longHits = LONG_TERM_KEYWORDS.filter((k) => text.includes(k)).length;
    const shortHits = SHORT_TERM_KEYWORDS.filter((k) => text.includes(k)).length;
    const longTerm = clamp(50 + longHits * 12 - shortHits * 12);

    // 계획/실행: how long the user actually deliberated before finalizing.
    const planned =
      input.decisionHours < 1 ? 30 : input.decisionHours < 24 ? 50 : input.decisionHours < 72 ? 65 : 80;

    return {
      rational,
      emotional: 100 - rational,
      longTerm,
      shortTerm: 100 - longTerm,
      planned,
      executionFocused: 100 - planned,
    };
  },
};
