import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./lib/generated/prisma/client";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const userId = "cmrcel5370000h9j2fd83erid";

const decision = await prisma.decision.create({
  data: {
    userId,
    category: "학업/전공",
    title: "[TEMP-VERIFY] 교환학생 가기",
    rawInput: "[TEMP-VERIFY] 교환학생을 갈지 말지 고민",
    background: "교환학생 기회가 생겼다",
    situation: "학업 vs 새로운 경험 사이 고민",
    criteria: ["성장"],
    concerns: ["학점 공백"],
    finalChoice: "교환학생 가기",
    confidence: 80,
    status: "COMPLETED",
    options: { create: [{ title: "교환학생 가기", sortOrder: 0 }, { title: "그냥 학교 다니기", sortOrder: 1 }] },
  },
});

const reflection = await prisma.reflection.create({
  data: {
    decisionId: decision.id,
    actualResult: "[TEMP-VERIFY] 새로운 친구들을 사귀고 시야가 넓어졌어요.",
    satisfaction: 90,
    actualVsExpected: "생각보다 적응이 쉬웠어요.",
    wouldChooseAgain: "YES",
    chooseAgainReason: "정말 좋은 경험이었어요.",
    reason: "망설이지 말고 가보세요.",
  },
});

const dedupeKey = `lifolio-user-${decision.id}`;
const caseRow = await prisma.decision_cases.create({
  data: {
    title: decision.title,
    category: decision.category,
    options: ["교환학생 가기", "그냥 학교 다니기"],
    final_choice: decision.finalChoice!,
    criteria: decision.criteria,
    expected_outcome: "새로운 경험",
    anxieties: decision.concerns,
    actual_outcome: reflection.actualResult,
    satisfaction: reflection.satisfaction,
    would_choose_again: "yes",
    background: decision.background!,
    situation: decision.situation!,
    outcome_gap: reflection.actualVsExpected,
    advice_for_others: reflection.reason!,
    source_url: `lifolio://decision/${decision.id}`,
    source_name: "Lifolio 사용자",
    dedupe_key: dedupeKey,
  },
});

await prisma.caseProfile.create({
  data: {
    caseId: caseRow.id,
    subtitle: "[TEMP-VERIFY] 교환학생 경험담",
    detailTag: decision.category,
    date: "2026.07.18",
    tags: "#학업 #전공",
    steps: [
      { label: "상황", value: decision.situation, dotColor: "bg-secondary-fixed" },
      { label: "고민", value: decision.background, dotColor: "bg-tertiary-fixed" },
      { label: "선택", value: decision.finalChoice, dotColor: "bg-primary-container" },
      { label: "결과", value: reflection.actualResult, dotColor: "bg-secondary" },
    ],
    authorInitials: "LF",
    authorAvatarColor: "bg-primary-fixed text-on-primary-fixed",
    sameChoiceAgainText: reflection.chooseAgainReason,
  },
});

await prisma.libraryCaseSubmission.create({
  data: {
    decisionId: decision.id,
    status: "APPROVED",
    title: decision.title,
    category: decision.category,
    background: decision.background!,
    situation: decision.situation!,
    options: ["교환학생 가기", "그냥 학교 다니기"],
    finalChoice: decision.finalChoice!,
    criteria: decision.criteria,
    expectedOutcome: "새로운 경험",
    anxieties: decision.concerns,
    actualOutcome: reflection.actualResult,
    satisfaction: reflection.satisfaction,
    wouldChooseAgain: "yes",
    chooseAgainReason: reflection.chooseAgainReason,
    outcomeGap: reflection.actualVsExpected,
    adviceForOthers: reflection.reason!,
    subtitle: "[TEMP-VERIFY] 교환학생 경험담",
    detailTag: decision.category,
    tags: "#학업 #전공",
    authorInitials: "LF",
    publishedCaseDedupeKey: dedupeKey,
    reviewedAt: new Date(),
  },
});

console.log(JSON.stringify({ decisionId: decision.id, reflectionId: reflection.id, dedupeKey }, null, 2));
await prisma.$disconnect();
