# Lifolio

의사결정 과정과 그 이후의 결과를 구조화하여 기록하는 라이프로그 플랫폼.
Stitch로 디자인된 9개 화면(스플래시 → 로그인 → 홈 → AI 상담 → 히스토리 →
라이브러리 → 리포트 → 타임캡슐 회고 → 회고 알림) 프로토타입을 실제로 동작하는
웹사이트로 옮긴 프로젝트입니다.

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · 모바일 우선.

## Getting Started

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.
`/`(스플래시)에서 시작해 로그인 후 `/home`으로 이동하는 흐름입니다.

## Project structure

- `app/page.tsx` — 스플래시
- `app/login/page.tsx` — 로그인
- `app/(app)/*` — 로그인 후 화면 (home, consult, history, library, report, capsule).
  공통 헤더/하단 내비게이션은 `app/(app)/layout.tsx`에서 관리합니다.
- `components/` — Header, BottomNav, Fab, TimeCapsuleModal 등 공용 컴포넌트
- `lib/types.ts`, `lib/mock-data.ts` — 목업 데이터. Supabase 스키마가 준비되면
  이 파일들을 실제 쿼리로 교체하면 됩니다.

## Roadmap 메모

- **Supabase**: 인증(카카오/이메일 로그인 자리 표시 버튼) 및 decisions/reflections
  테이블 연동 예정. `lib/mock-data.ts`의 타입이 대략적인 스키마 형태를 따르고 있습니다.
  Library 사례 데이터는 별도 프로젝트 `lifolio-collector`가 채우는 Supabase
  `decision_cases` 테이블을 그대로 읽어올 예정입니다.
- **OpenAI API**: `/consult` 채팅과 `/report` AI 코멘트를 실제 모델 호출로 교체 예정.
  API 키 보호를 위해 Route Handler(`app/api/*`)를 통해 서버에서 호출하도록 구성하세요.

## Deploy to Cloudflare Pages

[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)로 구성되어 있습니다.

```bash
npm run cf:preview   # 로컬에서 Cloudflare Workers 런타임으로 미리보기
npm run cf:deploy    # Cloudflare 계정에 배포 (wrangler 로그인 필요)
```

설정 파일: `wrangler.jsonc`, `open-next.config.ts`. Supabase/OpenAI 환경 변수는
`wrangler.jsonc`의 `vars` 또는 `wrangler secret put`으로 추가하세요.
