# V2 lead-review validation — September 23, 2026

## Rebuilt scope

Two review stages with three check categories: scenario planning, pairwise
potential duplication and implementation/assertion coverage. The report connects
criteria, source context, scenario inventory, code and supplied run evidence.
Lead decisions are downloaded and imported as separate, run-bound review records.

## Live Jev benchmark

Command: `npm run review:benchmark`.

- Input: `examples/lead-review.json`; gold: `fixtures/workflow-gold.json`.
- Rubric: `lead-review-v2`; provisional probability threshold: 0.80.
- 13 requests completed; no API errors or skipped requests.
- Exact raw finding matches: **11/13 (84.6%)**. Command correctly exited 1.
- Routed recommendations: 5 positive, 3 negative, 5 human judgment.
- The ineffective passing test was correctly flagged `assertion_gap` (1.00).
- The duplicate viewer pair was correctly flagged `duplicate_candidate` (1.00).
- Different-role pairs were correctly classified `distinct` (0.98 each).
- The missing editor scenario was correctly flagged `coverage_gap` (0.94).
- Missing helper implementation was correctly `insufficient_evidence` (0.95).

Disagreements retained without rewriting labels:

1. `CRM-REVIEW:implementation:AC3`: expected `assertion_gap` because the declared
   complete implementation set omits editor update assertions. Jev selected
   `insufficient_evidence` (0.88).
2. `CRM-REVIEW:implementation:AC4`: expected `ambiguous_scope` because export role
   permissions are undefined. Jev selected `assertion_gap` (0.47); local routing
   requested human judgment.

Additional uncertainty: the adequate admin implementation selected `supported`
with only 0.53 probability, so it also routed to human judgment. The planning
export criterion selected `ambiguous_scope` at 0.72 and remained neutral.

These are real model calls over authored synthetic evidence. Embedded browser
run statuses are explicitly illustrative, not measured Playwright executions.
No existing CRM repository source was sent in this run. This small benchmark is
not a production accuracy or calibrated probability claim.

## Verification

- `npm run typecheck`: passed.
- `npm test`: 28 passed (15 existing + 13 v2 tests).
- `npm run review:preview`: 13 exact request packets, no API calls.
- `npm run eval:preview`: legacy 9-request preview passed.
- `npm run eval:harness:preview`: legacy 2-request local evidence preview passed.
- `npm run report:build`: new and historical reports rebuilt offline.
- Installed harness Playwright runtime, headless Chromium: checked 13 findings,
  five matrix rows, stage/decision filters, code evidence, benchmark/preview tabs,
  reviewer JSON download, absence of JS errors and mobile document overflow.
- Reviewer import CLI: verified on an isolated copy of the report; append-only
  history and archived review were preserved, original model rows unchanged.
  Verification records were removed; the actual benchmark has no fabricated approvals.
- Desktop and mobile screenshots inspected; saved in ignored `artifacts/`.

## Skipped or unavailable gates

The workspace `npm run context:ui:resolve` still fails because it points to the
missing `projects/ui-automation/role-aware-mockserver` directory. This unrelated
resolver was not changed. The evaluator uses its explicit input snapshot.

No application Playwright suite was run: executable browser tests, application
code, mockserver and harness were not changed. Browser verification exercised
only the local report using the already installed runtime. No automatic Jira,
repo-source or Playwright report import has been added; the existing agent supplies
a normalized snapshot as documented in `docs/agent-handoff.md`.

## Historical v1 record

The material below describes the previous rubric and must not be compared as
though its verdict metric and the v2 exact-finding metric were identical.

# Validation record

## September 23, 2026 — live access works

After the account owner added a card, `npm run eval:benchmark` completed all nine
synthetic evaluations with no API errors. The rubric and gold labels were unchanged.

- Raw verdict agreement: **8/9 (88.9%)** on this small synthetic set.
- Jev selected 3 positive, 4 negative and 2 neutral verdicts.
- Case 09 expected neutral (ticket/developer-scope conflict); Jev chose negative
  with probability 0.57. Local policy routed it to neutral.
- Cases 01–03 each returned a positive verdict but a `missing_evidence` reason.
  These inconsistent answers were routed to neutral by the existing policy.
- Final routing: 0 positive, 3 negative and 6 neutral; routed agreement 6/9.
- The benchmark exited nonzero because one raw verdict disagreed with gold.
  No labels or questions were changed to force a passing result.

The new graph report preserves all of these distinctions. `npm run report:build`
generates it from saved responses with no additional API calls.

TypeScript and 15 offline tests passed. Desktop/mobile browser checks passed
for graph counts, filtering, search, case details, mobile overflow and script errors.

The two-case CRM harness run is pending explicit repository-content export
approval: automatic approval review rejected sending its three source evidence
files to Vercel/TypeSafe. No harness model responses were generated in that attempt.

## September 22, 2026 — initial setup

## Completed

- Installed isolated dependencies with AI SDK 7.0.109; npm reported no known
  vulnerabilities at installation time.
- `npm run typecheck`: passed.
- `npm test`: 13 offline tests passed. These verify evaluator behavior with
  injected responses, not Jev's real-world accuracy.
- `npm run eval:preview`: generated nine synthetic request packets without
  sending expected labels or making model calls.
- `npm run eval:harness:preview`: resolved and read three current CRM harness
  evidence files and generated two criterion-specific requests.
- Verified `.env.local` and generated reports are ignored by Git.

## Live evaluation blocked by Vercel

`npm run eval:benchmark` attempted the first synthetic case. Vercel returned
HTTP 403, so eight remaining requests were not run. Zero model decisions were
returned; accuracy is unavailable, not 0%.

A diagnostic using the configured key in this project's `.env.local` confirmed
that AI Gateway requires a valid credit card on file before serving free-credit
requests. A diagnostic against the older harness credential file found that
file still blank and returned HTTP 401. No key value was printed or committed.

The existing failed-run report was updated locally with the verified billing
reason and separate not-run counts; this did not create simulated Jev results.
See `artifacts/benchmark.html` and `artifacts/benchmark.json`.

The live harness review was skipped because it would hit the same account
restriction. If the account owner completes Vercel's billing verification, run:

```bash
npm run eval:benchmark
npm run eval:harness
```

## Existing workspace gates

`npm run context:ui:resolve` at the workspace root still fails because it targets
the former `projects/ui-automation/role-aware-mockserver` location. This new
layer's explicit read-only adapter resolves the existing harness independently.
No existing test files, page objects, assertion helpers, or root routing settings
were changed. Browser regression gates were skipped because this change adds
only an isolated evaluation project and reads existing browser-test evidence.

## CRM benchmark instrumentation — 11 October 2026

Typecheck passed; 31 offline tests passed with local read-only harness adapter configured. CRM preview built 16 requests; v1 preview, harness preview and review preview passed. Live CRM evaluation returned HTTP 403 on the first request: zero evaluated, one error, 15 unrun. Metrics correctly remain null. See benchmarks/README.md; generated reports and credentials are excluded from Git.
