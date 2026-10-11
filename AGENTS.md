# Jev evaluation layer

This is an isolated Node/TypeScript evaluation project, not a new browser or API
test framework. The user authorized reading the existing Playwright harness as
evidence. Keep executable browser tests and all existing harness files unchanged.

Read `contexts/task.yml` (or the selected task), then run `npm run context:resolve`.
The resolver writes exact evidence paths and hashes to `artifacts/resolved-context.yml`.
Read referenced evidence before drawing conclusions; paths alone are not coverage.

Expected labels in `fixtures/gold.json` are evaluation-only. Never send them,
their rationale, benchmark IDs, or fixture filenames in model state. Never tune
gold labels just to make Jev pass. Report disagreements and missing evidence.

Live calls use Vercel AI SDK `experimental_evaluate`, `typesafe-ai/jev`, and
`AI_GATEWAY_API_KEY`. Never log keys or raw SDK errors (they may include headers).
Preview and unit tests must make no network calls. Reports distinguish raw model
decisions from local routing, API errors, and expected labels. Notes are local
templates selected by structured reason codes, not generated Jev explanations.

Run `npm run typecheck`, `npm test`, and both preview commands after changes.
Run the labeled live benchmark when credentials are available. A passing offline
test suite proves the evaluation machinery works; it does not prove Jev accuracy.


## V2 lead-review workflow

The default documented workflow is now `review:*`, implemented in `src/workflow.ts`.
V1 `eval:*` commands and fixtures remain historical comparison tools. Do not mix
v1 raw verdict metrics with v2 exact-finding metrics.

For v2, read `examples/lead-review.json` as the input contract. Planning, duplication
and implementation are separate checks. Gold in `fixtures/workflow-gold.json`,
benchmark IDs, source locations and reviewer decisions must stay out of model
packets. Preserve completeness flags, source conflicts and missing helper evidence.
Never fabricate lead approval or browser execution evidence. Synthetic run records
must stay labeled illustrative. Duplication candidates never delete tests.

Run `npm run review:preview` in addition to the existing gates. The v2 live
benchmark uses only authored synthetic evidence; it does not authorize exporting
existing repository source. Keep new report assets local with no network requests.
Reviewer decisions are append-only and bound to a saved run ID, never merged into
model predictions or reused for changed inputs.
