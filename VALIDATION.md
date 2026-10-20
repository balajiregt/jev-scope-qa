# Validation — October 20, 2026

Repository identity: `playwright-decision-bench`.

Current scope: requirement-to-test coverage and smoke-suite selection, comparing
local Laya and OpenAI Decisions. Both provider integration and these two complete
workflows remain pending. No measured model performance is claimed.

The retained offline scaffold includes schema validation, evidence isolation,
normalized response parsing, probability routing, error/refusal handling and
comparison metrics tested with injected responses. Earlier provider-specific
runners, saved results, report screenshots and automatic publishing are retired.

All 26 offline tests and TypeScript checking passed. The four preview/context commands completed without network calls.

Verification commands: `npm run typecheck`, `npm test`, `npm run context:resolve`,
`npm run review:preview`, `npm run compare:preview`, `npm run benchmark:crm:preview`.
Live benchmarks and application Playwright suites are skipped: no live adapter is
exposed, and the existing harness is unchanged. Offline tests do not prove accuracy.
