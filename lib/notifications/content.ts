export interface NotificationContent {
  title: string;
  body: string;
  linkUrl: string;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function reflectionDueContent(decision: { id: string; title: string }): NotificationContent {
  return {
    title: "회고할 시간이에요",
    body: `"${truncate(decision.title, 40)}" 결정, 이제 돌아볼 시간이에요.`,
    linkUrl: `/capsule?decisionId=${decision.id}`,
  };
}

export function libraryPublishedContent(decision: { id: string; title: string }, caseId: string): NotificationContent {
  return {
    title: "라이브러리에 게재됐어요",
    body: `회원님의 "${truncate(decision.title, 40)}" 이야기가 라이브러리에 올라갔어요.`,
    linkUrl: `/library/${caseId}`,
  };
}

export function inProgressReminderContent(decision: { id: string; title: string }): NotificationContent {
  return {
    title: "진행 중인 고민이 있어요",
    body: `"${truncate(decision.title, 40)}", 아직 정리 중이시죠? 잠깐 이어가볼까요?`,
    linkUrl: `/consult?decisionId=${decision.id}`,
  };
}

export function statusUpdateNudgeContent(decision: { id: string; title: string }): NotificationContent {
  return {
    title: "요즘 어떻게 되어가고 있나요?",
    body: `"${truncate(decision.title, 40)}" 결정, 근황을 남겨보세요.`,
    linkUrl: `/home/active-decisions`,
  };
}

export function followUpReflectionContent(decision: { id: string; title: string }): NotificationContent {
  return {
    title: "다시 돌아볼 시간이에요",
    body: `"${truncate(decision.title, 40)}", 시간이 좀 지났어요. 지금은 어떤가요?`,
    linkUrl: `/capsule?decisionId=${decision.id}`,
  };
}

export function reportLevelUpContent(level: number): NotificationContent {
  return {
    title: "리포트가 업데이트됐어요",
    body: `Level ${level} 리포트가 새로 열렸어요.`,
    linkUrl: `/report`,
  };
}
