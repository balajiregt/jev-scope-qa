# Publication package — October 20, 2026

Status: Medium article and LinkedIn post remain unpublished drafts.

## Editorial scope

Title: **Can Decision Models Help Us Validate Coverage and Choose Smoke Tests?**

Both drafts follow: identify suitable review candidates → apply local Laya and
OpenAI Decisions → measure quality, performance and practical value per candidate.
The primary use cases are requirement-to-test coverage validation and smoke-suite
selection from the full E2E inventory. Assertion adequacy supports coverage;
duplication supports suite selection. They retain the existing agent + MD/skill
review as the baseline for added value.

- `medium-article.md`: concise article with candidate table, experiment flow,
  concrete examples and measurement plan.
- `linkedin-post.md`: short project introduction; no measured superiority claim.
- `../evaluation-scope.md`: detailed protocol and implemented-versus-planned inventory.

## Publication checks

- Repository: https://github.com/balajiregt/playwright-decision-bench.
- Results destination: https://framework-benchmarks-balaji.netlify.app/. The new
  experiment is not yet measured; no model quality or speed claim is established.
- The supplied Laya weights and upstream project are confirmed. Local inspection
  found Ollama/Qwen3:4b; Laya needs its own verified runtime and checkpoint.
- Coverage matrices, smoke selection and live provider adapters remain pending.
- Runtime reduction and failure-detection retention need actual execution evidence.
- Do not reuse retired results or graphs under another model's name.
- Keep model/checkpoint, protocol, sample counts, hardware and error coverage visible.
- Publish only reviewed aggregate data; keep raw evidence and credentials local.

Both articles remain drafts. Once measurements exist, add a small per-use-case
results table and a direct link to the relevant dashboard view.
