# Playwright Decision Bench

Compare **direct TypeSafe Jev** with **local Laya** for requirement coverage and
smoke-suite proposals against an existing Playwright repository.

[Project](https://github.com/balajiregt/playwright-decision-bench) ·
[Private viewer](https://agentic-qa-metrics-viewer.netlify.app/) ·
[Aggregate comparisons](https://framework-benchmarks-balaji.netlify.app/#jev-laya-comparison)

```text
Requirements + test/assertion evidence + smoke policy
                         ↓
        Same bounded evidence and Choice rubric
                         ↓
          Local Laya  |  direct TypeSafe Jev
                         ↓
  Coverage labels → identical deterministic smoke policy
                         ↓
          Evidence report → QA lead review
```

The agent creates tests; Playwright runs them. This layer reviews supplied evidence
and proposes a suite. It does not change tags, delete tests or approve releases.

## Compare your team's repository

Follow the [Jev / Laya guide](docs/jev-laya-comparison.md) to import explicit
requirements, record three Playwright runs, configure MPS/CPU and your TypeSafe key,
and inspect the paired coverage matrix and smoke proposals.

```bash
npm run qa -- compare --providers laya
npm run qa -- compare --providers laya,jev --allow-hosted
```

Both commands use the generated local config. Only the second sends evidence to
TypeSafe. Detailed `comparison.json` stays private in the browser-only QA viewer;
`metrics.json` is the validated aggregate for Framework Benchmarks. Execution
results, model probability and historical pass rates remain separate signals.
Reviewer labels are optional; accuracy is unavailable without them.

The [existing local team commands](docs/team-quickstart.md) and earlier
[validation results](docs/team-validation.md) remain available. The pilot below
is historical, separate from the Jev / Laya comparison.

## Historical pilot and local-provider support

- Coverage: **covered / partial / uncovered / needs_judgment**, with references to
  the evidence considered. Missing helpers and ambiguous requirements preserve uncertainty.
- Smoke: **include / exclude / needs_judgment**, followed by deterministic subset
  selection checking mandatory journeys, dependencies, reliability and budget.
- Local Laya 0.4.12, pinned English checkpoint, Python/MPS adapter with token
  preflight. Oversized packets are excluded for every provider; no silent truncation.
- Local Ollama `qwen3:4b` proxy using the same evidence and rubric. It is not a
  measurement of a complete Copilot/Claude agent workflow.
- Optional **direct OpenAI Decisions** adapter using `OPENAI_API_KEY`. Laya needs
  no key. The Vercel Gateway route is no longer used.
- JSON + HTML reports: accuracy, gaps, false reassurance, p50/p95 latency,
  repeatability, operational failures and safe smoke proposals.

## First pilot

16 authored synthetic decisions × 2 repetitions; **64 valid local assessments**.
The held-out partition has four coverage cases and three smoke candidates.
Both local models matched 1/4 coverage labels and 1/3 smoke labels on each repetition.
This is a small, author-labeled sanity pilot, not evidence for unattended adoption.
OpenAI has no valid measurements; direct credentials are not configured.

Actual Playwright runtime reduction, fault-detection retention, hardware operating
cost and human review time remain **unmeasured**. Fixture duration values are authored
estimates. See [pilot findings](docs/pilot-findings.md).
The [accuracy diagnosis](docs/accuracy-diagnosis.md) separates prompt/context effects,
evidence weaknesses and unresolved model limitations before adoption.

## Run locally

Node.js 22+, Python 3.10+, and Ollama with `qwen3:4b`:

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install -r python/requirements.txt
npm run typecheck
npm test
npm run bench:preview       # offline; no model calls
npm run bench:preflight     # downloads/loads pinned Laya; checks token fit
npm run bench:live -- 2     # bounded synthetic pilot; direct OpenAI only if keyed
npm run bench:report       # rebuild graphs from recorded responses; no calls
npm run report:serve
```

Open `http://127.0.0.1:8791/decision-bench.html`. Local raw reports and model cache
stay under ignored `artifacts/`. The first Laya load downloads checkpoint weights.
The default device is `mps`; set `LAYA_DEVICE=cpu` on non-Apple systems. Live runs load
`.env.local`; use `.env.example` for the optional direct API key. No repo-source
export or arbitrary input path is exposed by the pilot CLI. Each run is capped at
150 assessments and stops a provider after access/billing/rate-limit failures.

## Design and limits

[Protocol](benchmarks/decision-pilot/README.md) · [Adapter contract](docs/decisions-comparison.md) ·
[Candidate scope](docs/evaluation-scope.md) · [Evidence handoff](docs/agent-handoff.md)

[Medium draft](docs/blog/medium-article.md) · [LinkedIn draft](docs/blog/linkedin-post.md)

The earlier three-rubric offline previews remain available for reference; the
`bench:*` commands implement the two current use cases. Probability routing uses a
provisional 0.8 threshold, not a calibrated accuracy guarantee. Leads review all
proposals. Human-reviewed, larger datasets and real execution studies are next.
