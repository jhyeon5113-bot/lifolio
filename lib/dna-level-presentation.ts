// Pure, side-effect-free presentation data for the Decision DNA level
// ladder (Level 1-5). Kept separate from lib/dna-repo.ts (Prisma-dependent)
// so Client Components like ReportTabs can import this without dragging
// server-only code into the browser bundle. Only Level 1 has real content
// today (see lib/ai/stubProvider.ts) — Levels 2-5 are locked placeholders
// per the PRD's MVP scoping, shown here purely for the confidence ladder.

export type DnaLevel = 1 | 2 | 3 | 4 | 5;

// How many completed reflections unlock each level.
export const LEVEL_THRESHOLDS: Record<DnaLevel, number> = {
  1: 3,
  2: 7,
  3: 15,
  4: 30,
  5: 50,
};

// "Lifolio가 당신을 이해한 정도" — how much of the eventual Level 5 analysis
// is unlocked at each level. Presentational only, not derived from any
// model confidence score.
export const LEVEL_CONFIDENCE: Record<DnaLevel, number> = {
  1: 22,
  2: 41,
  3: 63,
  4: 84,
  5: 96,
};

export const LEVEL_TITLES: Record<DnaLevel, string> = {
  1: "나는 어떤 사람인가?",
  2: "나는 왜 그렇게 결정하는가?",
  3: "당신은 어떤 사람이 되어가고 있는가?",
  4: "나도 몰랐던 나의 무의식",
  5: "미래의 나 사용설명서",
};

// Teaser shown at the bottom of level N, previewing level N+1. Level 5 has
// no next level.
export const LEVEL_PREVIEWS: Record<Exclude<DnaLevel, 5>, string> = {
  1: "당신이 흔들리는 순간과, 결정을 미루는 진짜 이유가 공개돼요.",
  2: "\"당신이라는 사람\"을 분석해요.",
  3: "무의식적인 편향이 공개돼요.",
  4: "당신만의 의사결정 원칙이 완성돼요.",
};

// "Lifolio의 편지" — a fixed, non-personalized closing note shown at the
// bottom of every level's report, same for every user at that level (unlike
// the analysis items above it, which are generated from the user's own
// data). First line is the greeting/headline, the rest is the body.
export const LEVEL_LETTERS: Record<DnaLevel, string> = {
  1: `당신을 이해하기 시작했습니다.
첫 번째 리포트에 도달한 것을 축하드립니다.

사람들은 매일 수많은 결정을 내리지만, 그 과정과 이유를 기록하는 사람은 많지 않습니다. 그래서 대부분의 선택은 시간이 지나면 흐릿해지고, 무엇을 기준으로 결정했는지조차 잊어버리곤 합니다.

당신이 남긴 기록들은 단순한 메모가 아니라, 앞으로의 선택을 더 잘 이해하기 위한 시작점입니다.

아직은 충분한 데이터가 쌓였다고 말할 수는 없습니다. 하지만 중요한 것은 완벽한 분석이 아니라, 스스로의 의사결정을 돌아보기 시작했다는 사실입니다.

앞으로 더 많은 경험이 기록될수록, 이 리포트는 단순한 기록을 넘어 당신만의 의사결정 지도로 발전하게 될 것입니다.

다음 리포트에서는 '어떤 선택을 했는지'를 넘어, '왜 그런 선택을 하게 되는지'를 함께 살펴보겠습니다.`,
  2: `선택에는 언제나 이유가 있습니다.

우리는 종종 결과만 기억하고, 그 선택을 하게 된 이유는 잊어버립니다. 하지만 의사결정은 결과보다 과정에서 더 많은 것을 말해줍니다.

같은 결정을 하더라도 사람마다 중요하게 생각하는 기준은 다르고, 흔들리는 순간도 모두 다릅니다.

이제부터는 단순히 어떤 선택을 했는지가 아니라, 그 선택 뒤에 있는 생각과 기준을 함께 이해해 나가는 단계입니다.

앞으로 더 많은 경험이 쌓이면, 반복되는 패턴과 변화까지도 더욱 선명하게 확인할 수 있을 것입니다.

다음 리포트에서는 여러 번의 선택을 통해 만들어지고 있는 '나만의 의사결정 방식'을 함께 살펴보겠습니다.`,
  3: `의사결정은 결국 나를 닮아갑니다.

한 번의 선택만으로 사람을 설명할 수는 없습니다. 하지만 시간이 지나고 여러 번의 의사결정이 쌓이면, 그 안에는 조금씩 공통된 방향과 가치관이 드러나기 시작합니다.

우리는 스스로를 잘 알고 있다고 생각하지만, 실제 선택은 때때로 예상과 다른 모습을 보여주기도 합니다.

그래서 의사결정을 기록한다는 것은 단순히 결과를 남기는 일이 아니라, 자신을 조금씩 이해해 가는 과정이기도 합니다.

앞으로 더 많은 기록이 쌓일수록 지금은 보이지 않는 연결점들도 더욱 선명해질 것입니다.

다음 리포트에서는 겉으로 드러나지 않았던 무의식적인 의사결정 패턴을 함께 발견해보겠습니다.`,
  4: `가장 어려운 것은 나를 객관적으로 바라보는 일입니다.

사람은 누구나 자신만의 기준으로 결정을 내립니다. 하지만 실제 행동은 스스로 인식하고 있는 모습과 조금 다를 수도 있습니다.

그래서 반복되는 의사결정을 돌아보면, 평소에는 미처 알아차리지 못했던 습관과 편향, 그리고 선택의 방식이 조금씩 드러나기 시작합니다.

이러한 발견은 정답이나 오답을 가르기 위한 것이 아니라, 앞으로 더 나은 결정을 내릴 수 있는 새로운 기준이 되어줍니다.

이제 마지막 단계에서는 지금까지의 모든 기록을 하나로 연결하여, 당신만을 위한 의사결정 사용설명서를 완성하게 됩니다.`,
  5: `이제 당신만의 사용설명서가 완성되었습니다.

사람은 살아가는 동안 수없이 많은 선택을 합니다. 어떤 결정은 하루 만에 끝나고, 어떤 결정은 몇 년 동안 삶에 영향을 미치기도 합니다.

하지만 시간이 지나면 우리는 어떤 마음으로 선택했는지, 무엇을 가장 중요하게 생각했는지 조금씩 잊어버립니다.

그래서 의사결정을 기록하는 일은 과거를 남기기 위한 것이 아니라, 앞으로의 나를 더 잘 이해하기 위한 과정입니다.

이 사용설명서는 정답을 알려주는 매뉴얼이 아닙니다. 대신 중요한 갈림길에서 '나는 어떤 사람인지', '무엇을 기준으로 선택해야 후회가 적은지'를 떠올릴 수 있도록 도와주는 하나의 나침반입니다.

앞으로도 새로운 고민과 선택은 계속될 것입니다. 그리고 그 모든 경험은 지금의 사용설명서를 조금씩 더 정확하고, 더 깊이 만들어 갈 것입니다.

당신의 삶은 수많은 의사결정으로 이루어집니다. 그리고 그 모든 결정은, 결국 당신이라는 사람을 만들어갑니다.`,
};

export function getConfidencePercent(level: DnaLevel): number {
  return LEVEL_CONFIDENCE[level];
}
