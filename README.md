# Playwright Decision Bench

Identify where decision models help an agentic Playwright workflow, then compare
**local Laya and OpenAI Decisions** against the existing agent + MD/skill baseline.

Repository: [balajiregt/playwright-decision-bench](https://github.com/balajiregt/playwright-decision-bench).
Results destination: [Framework Benchmarks](https://framework-benchmarks-balaji.netlify.app/).

## Two primary use cases

| Use case | Planned output | Quality measures |
|---|---|---|
| Requirement-to-test coverage | Covered, partial, uncovered or needs judgment, with evidence links | Gap precision/recall and false-covered findings |
| Smoke selection from the E2E suite | Proposed subset with critical journeys, dependencies and runtime constraints checked | Critical coverage retained, missed journeys and measured runtime reduction |

Assertion adequacy supports coverage validation. Duplication helps refine the smoke
suite. The coding agent produces tests, Playwright executes them, and leads approve
changes. Models do not automatically delete tests, change tags or approve releases.

## Current status

Scope and publication drafts are ready. Provider integration, expanded datasets,
requirement coverage labels/matrix and smoke-selection workflow are **pending**.
No Laya/OpenAI performance results have been measured or published.

The retained offline scaffold validates supplied evidence, builds planning/assertion/
duplication questions and tests normalization, routing and comparison calculations
using injected responses. It is infrastructure for the experiment, not the finished
two-use-case benchmark. Its normalized question packets are not verified provider
wire requests. Live CLI commands and automatic publication are intentionally absent.

## Explore locally

Use Node.js 22+:

```bash
git clone https://github.com/balajiregt/playwright-decision-bench.git
cd playwright-decision-bench
npm ci
npm run context:resolve
npm run typecheck
npm test
npm run review:preview
npm run compare:preview
npm run report:serve
```

Open `http://127.0.0.1:8791/comparison-preview.html`. It contains no invented
findings or performance scores. `npm run benchmark:crm:preview` checks the larger
synthetic evidence inventory offline. No preview command loads API credentials.

## Experiment and publication

- [Scope, selection policy and measurement plan](docs/evaluation-scope.md)
- [Comparison contract and implementation status](docs/decisions-comparison.md)
- [Agent evidence handoff](docs/agent-handoff.md)
- [Benchmark protocol and publication boundary](benchmarks/README.md)
- [Medium draft](docs/blog/medium-article.md) · [LinkedIn draft](docs/blog/linkedin-post.md)

Measure quality, p50/p95 latency, cloud charges/local resources, reliability and
review effort per use case. Publish only validated public aggregates; missing data
stays unavailable. Raw evidence and credentials stay local. Both articles are drafts.
