# Playwright Decision Bench

This isolated TypeScript project researches requirement-to-test coverage and
smoke-suite selection using local Laya and OpenAI Decisions. Keep the existing
Playwright harness and executable browser tests unchanged unless explicitly requested.

Read `contexts/task.yml`, then run `npm run context:resolve`. Supplied evidence,
assertions and completeness flags determine coverage; names, claimed links and
passing run records are not proof. Preserve uncertainty and missing helpers.

The bench:* commands implement a bounded synthetic coverage/smoke pilot. Laya and
Qwen run locally. OpenAI is optional and direct-only; never use old Gateway keys. `workflow.ts` retains general rubric
machinery; `comparison.ts` uses normalized injected responses in tests. Do not
claim native API compatibility, live results or measured gains from offline tests.

Gold labels, rationales, benchmark IDs, source filenames and reviewer decisions
must never enter model evidence packets. Do not change gold to make a model pass.
Never log credentials, raw provider errors or headers. No automatic repo-source export.

Keep raw findings, local probability routing, refusals and operational errors
separate. Keep models and protocol versions identified. No fabricated browser
execution, lead approval, costs or latency. Smoke proposals require whole-suite
coverage, dependency and runtime constraints before lead approval.

Run `npm run typecheck`, `npm test`, `npm run context:resolve`,
`npm run review:preview`, `npm run compare:preview` and
`npm run benchmark:crm:preview` and `npm run bench:preview` after implementation changes. Previews and tests
must not use network APIs. Documentation-only changes need link/reference checks.

The public destination is framework-benchmarks-balaji.netlify.app. The result feed is benchmark-results/decision-bench.json. Keep raw reports, prompts, code, keys and reviewer notes private.
Do not reuse retired provider results under a new model name. Medium/LinkedIn
remain drafts. Report changed files, verification and any skipped gates.

## Reusable team CLI

The user-authorized `qa` commands accept explicit external repository and requirements
paths. They collect using the target repository's own Playwright runner. Keep source
and requirement evidence local; inference is loopback-only. `qa record` explicitly
runs the suite. `qa run` only lists tests and evaluates evidence. `qa publish` validates
the closed shared/team-metrics.mjs contract before any GitHub mutation. Do not widen
that public schema to include text, paths, IDs, raw responses or source. Team estimates
are unreviewed and must not be represented as measured model accuracy or approval.
