> Historical v1 guide. Use the project README for the current lead-review workflow. Run these commands from the project root.

# Jev scenario evaluator

An optional evaluation layer on top of the existing Playwright Agentic Framework.
It asks whether proposed scenarios and supplied assertion evidence cover ticket
acceptance criteria. It does not create a second Playwright framework or change
the existing tests. All new code and dependencies stay in this directory.

```text
Ticket + developer scope + generated scenarios
                   |
Task YAML -> resolve exact evidence files and hashes
                   |
Read scenario text and referenced test/helper implementations
                   |
Jev: evaluate each acceptance criterion separately
                   |
positive / negative / neutral + structured reason
                   |
Local probability/consistency checks -> human-readable note
                   |
Agent reviews coverage matrix -> existing Playwright verification
```

## Three outcomes

| Outcome | Meaning | Example |
| --- | --- | --- |
| Positive | Supplied scenario covers a clear criterion | Manager opens restricted URL and asserts Permission denied |
| Negative | Enough evidence shows a coverage gap or contradiction | Only the disabled navigation button is checked |
| Neutral | Human judgment or more evidence is required | Policy is ambiguous, helper implementation missing, or ticket and developer scope disagree |

Positive means good **coverage**, not positive-path business behavior: correctly
testing access denial is a positive review. Neutral is a legitimate expected
model answer. A timeout or authentication failure is a separate operational error.

## Start here

Use Node.js 22 or newer. From this folder:

```bash
npm ci
npm run typecheck
npm test
npm run eval:preview
```

These checks are offline after dependencies are installed. Preview writes the
exact proposed requests to `artifacts/requests-preview.json`; it does not invent
model answers. Open that file to see `state`, `questions`, and expected output
choices. IDs outside the nested `request` are local tracking fields only.

For a live call, set `AI_GATEWAY_API_KEY` in `.env.local`. The runner also reads
the existing harness's `.env.local` if no nonblank key was already provided.
Precedence is process environment, this project's `.env.local`, then the existing
harness's file. No new API key is necessary. The key is never sent as evidence.

```bash
# One synthetic case, then all nine labeled examples:
npm run eval:benchmark -- --case case-01
npm run eval:benchmark

# Optional repeatability check; three passes = 27 model requests:
npm run eval:benchmark -- --repeat 3
```

Live evaluation uses paid or promotional Vercel Gateway access. Check the current
[Jev price](https://vercel.com/ai-gateway/models/jev) before running; do not assume
promotional access is permanent. Each criterion uses one API request, with two
Choice questions evaluated together. There are no automatic retries; calls time
out after 30 seconds. Authentication, quota and rate-limit errors stop the run.

If the report says `billing_verification_required`, Vercel is refusing requests
until the account has a valid credit card on file. Free promotional model pricing
does not bypass this account requirement. Complete that step in your own Vercel
dashboard if desired, then rerun the same benchmark. Never add billing details to
this project. The September 22 attempt encountered this condition. After card
verification, the September 23 benchmark completed with 8/9 raw verdict matches.
See `VALIDATION.md` for the observed results and remaining limitations.

## How we test whether Jev is doing the right work

`fixtures/benchmark-inputs.json` contains nine **synthetic**, clearly scoped cases.
`fixtures/gold.json` contains independent expected labels and their rationale.
Gold labels, rationale, IDs and filenames are excluded from all model inputs.

| Cases | Expected | What they exercise |
| --- | --- | --- |
| case-01 to case-03 | Positive | Direct denial, viewer control restriction, required-field validation |
| case-04 to case-06 | Negative | Misleading title/missing assertion, wrong role, contradictory expected result |
| case-07 to case-09 | Neutral | Ambiguous requirement, unavailable helper, conflicting scope |

The benchmark records raw Jev verdicts separately from locally routed decisions,
full choice distributions, reason codes, usage, elapsed time, rubric version,
request hashes and evidence hashes. Reports show accuracy on completed calls,
matches out of all requested calls, a confusion matrix and false positive
approvals. API errors cannot count as correct neutral predictions. The command
returns a nonzero exit code for errors or a raw verdict/gold-label disagreement.
Do not rewrite gold labels just to get a passing run.

Outputs are `artifacts/benchmark.json` and `artifacts/benchmark.html`. Each command
replaces its previous report; copy the artifacts if you want to compare runs.
Repeated runs are pooled in metrics, and each prediction remains in row order.

## Visual graph report

```bash
npm run report:build
npm run report:serve
```

Open `http://127.0.0.1:8791/`. The report is also a standalone
`artifacts/index.html` that you can open directly in a browser. It embeds its
data and assets and makes no external requests. `report:build` reuses saved
responses; it makes no Jev API calls. Run it again after new evaluations.

The report contains:

- A count graph from expected labels to raw Jev verdicts to local decisions.
- A confusion matrix comparing expected labels and raw model predictions.
- A breakdown of explicit neutral answers, conflicting answers and low probabilities.
- Clickable graph nodes, case search and a detail panel with ticket/developer
  scope, criterion, scenarios, model probabilities and expected-label rationale.
- Tabs for benchmark and harness review when both saved runs exist. Unlabeled
  harness reviews have no accuracy score or invented expected labels.

Operational failures are excluded from verdict counts. A local neutral decision
must not be presented as Jev having selected neutral. The September 23 run is a
useful example: Jev selected positive for three cases, but its independent reason
question selected missing evidence, so local policy requested human review.

**Passing unit tests does not demonstrate Jev accuracy.** Unit tests use injected
responses to check packet construction, uncertainty routing, scoring, validation,
and secret-file boundaries. Even a 9/9 live result is only a smoke evaluation on
these examples, not evidence of production readiness. Add independently reviewed
real tickets and a held-out set before using results to influence automation.

## Review our actual Playwright harness

```bash
npm run eval:harness:preview
npm run eval:harness
```

This adapter reads the current CRM test, page object and assertion helper named
in `contexts/harness.yml`. It evaluates two explicit **assessment criteria** from
`fixtures/harness-inputs.json`: manager direct-route denial and viewer read-only
Accounts. These are review examples, not a claim of new approved product tickets.
The harness review has no fixed gold labels because the source can change.
Results appear in `artifacts/harness-review.json` and `.html`.

The existing harness is read-only. To act on a finding, return to its normal
planner/generator/reviewer workflow and run its focused Playwright commands.
This layer never edits assertions, executes model-selected commands, or turns a
model assessment into proof that a browser test passed.

The workspace's old central UI resolver still targets `projects/ui-automation`,
while the current harness lives under `qa-projects`. This project resolves its
declared evidence directly and records exact paths and hashes in
`artifacts/resolved-context.yml`; it does not repair unrelated routing settings.

## Add a real ticket

1. Copy an input record with a new local `id`.
2. Keep `ticket` and `developerScope` separate. Put each acceptance criterion in
   `criteria` with an ID and precise text.
3. Put the generated scenario steps and expected assertions in `scenarios`.
4. Supply relevant evidence text, or add explicit file aliases to
   `contexts/harness.yml` and reference them in `evidenceRefs`.
5. Create a task YAML pointing at the new inputs. Run a preview first:
   `node --import tsx src/cli.ts preview --task contexts/your-task.yml`.
6. Run `node --import tsx src/cli.ts review --task contexts/your-task.yml`. For a labeled
   benchmark, add a separate gold file to the task and use `benchmark` instead.

Only bounded, explicitly referenced evidence is sent. The resolver rejects hidden
credential files, unsupported extensions and paths outside the declared evidence
root. Review your evidence packet for sensitive application data before a live run.

## SDK and decision policy

`src/evaluator.ts` uses the Vercel AI SDK format:

```ts
import { experimental_evaluate as evaluate } from 'ai';

const result = await evaluate({
  model: 'typesafe-ai/jev',
  state: { ticket, developerScope, criterion, generatedScenarios, evidence },
  questions: {
    verdict: {
      type: 'choice',
      instructions: 'Assess the criterion using the supplied evidence.',
      criteria: {
        positive: 'Demonstrated coverage',
        negative: 'Clear missing or contradictory coverage',
        neutral: 'Human judgment or missing evidence'
      }
    }
  }
});
```

The production wrapper in this project adds a detailed rubric and a second Choice
for the reason. Jev chooses structured values; the readable positive/negative/
neutral **notes are local templates**, not free-form text generated by Jev.
Vercel also supports `boolean` and `score`; this first experiment needs Choice.

The selected class probability must be at least `JEV_MIN_PROBABILITY` (default
0.80) and the verdict/reason must agree, otherwise local routing requests human
review. This threshold is provisional and is **not** Jev's separate confidence
statistic or a guarantee of accuracy. Calibration needs your own labeled data.

References: [Vercel evaluation API](https://vercel.com/docs/ai-gateway/modalities/evaluation),
[AI SDK setup](https://vercel.com/docs/ai-gateway/sdks-and-apis/ai-sdk).
