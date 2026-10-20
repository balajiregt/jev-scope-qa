# Can Decision Models Help Us Validate Coverage and Choose Smoke Tests?

*A Playwright experiment with local Laya and OpenAI Decisions.*

As an E2E suite grows, two questions keep coming back: **are we testing the requirements, and which tests belong in the smoke suite?**

These are the two use cases I want to evaluate. The approach is simple: define the task, apply both decision models to the same evidence, then measure whether their recommendations help.

## 1. Validate test coverage against requirements

Give each model the acceptance criteria, test inventory and actual test/helper assertions. Ask it to classify coverage as **covered, partial, uncovered or needs judgment**.

For example, “Viewers cannot delete customers and the data remains intact” is not covered by checking that the Customers heading appears. A test that asserts access denial but never verifies data preservation provides only partial coverage.

The intended output is a requirement-to-test matrix with evidence links and remaining gaps. Multiple tests may collectively cover a criterion. Missing helpers or an incomplete inventory require judgment; a passing test alone does not prove coverage.

Assertion adequacy belongs inside this use case: it helps establish whether a claimed requirement-to-test link is meaningful.

## 2. Identify smoke tests from the full E2E suite

Give each model the test behaviors, critical business journeys, dependencies, recent durations, reliability data and the team's smoke policy.

Ask it to recommend **include, exclude or needs judgment** for each candidate. Then check the proposed suite as a whole: does it preserve mandatory journeys and dependencies within the execution budget?

A short test is not automatically a smoke test. A flaky test covering a critical journey may need repair or replacement; simply excluding it can leave the smoke suite blind.

Duplicate coverage matters here as a supporting consideration. The objective is a focused, feasible suite that retains the behavior the team considers essential.

## How the comparison works

```text
Requirements + test evidence + smoke policy
                    ↓
        Same assessment task and rubric
                    ↓
        Local Laya | OpenAI Decisions
                    ↓
    Coverage matrix or smoke-suite proposal
                    ↓
      Quality + performance measurements
                    ↓
               Lead review
```

The existing agent + MD/skill review is the baseline. Our local Ollama/Qwen model can support that baseline; Laya uses its own checkpoints and needs a verified serving setup. [Laya project](https://github.com/NandhaKishorM/laya)

Each model receives bounded evidence and typed Choice questions. Provider responses are validated and normalized; low certainty or missing evidence goes to human review. Local code checks suite constraints. The lead approves changes, and Playwright executes the tests.

## What we will measure

| Use case | Quality and value |
|---|---|
| Requirement coverage | Gap precision/recall, false-covered findings, label accuracy and reviewer effort |
| Smoke selection | Critical journeys retained, missed journeys, dependency/budget violations and measured runtime reduction |
| Both | Successful-call p50/p95 latency, cost, local resources, errors and repeated-run consistency |

There may be several valid smoke suites, so matching one reference list is not enough. We will measure failure-detection retention only by executing against diagnosed regressions or controlled faults.

Use held-out work items and repeat runs. Evaluate untuned Laya first; any fine-tuned variant receives a separate result. Neither a high probability nor agreement between models establishes correctness.

**Current status:** the scope and offline scaffold are ready. Laya/OpenAI integration,
the coverage matrix and smoke-selection workflow are planned. There are no measured
model-comparison results yet.

I’ll publish the measured results on [Framework Benchmarks](https://framework-benchmarks-balaji.netlify.app/), with separate coverage and smoke-selection comparisons, sample sizes and run conditions. The new experiment’s results are not published yet.

[Project](https://github.com/balajiregt/playwright-decision-bench).
