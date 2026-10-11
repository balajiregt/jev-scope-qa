# The Playwright Test Passed. Did It Test the Requirement?

*Exploring Jev as an evidence-based review layer for AI-generated scenarios and Playwright assertions.*

A test can have a convincing title, execute successfully, and still miss the behavior the ticket asked for.

Consider an acceptance criterion: a viewer who opens a customer-deletion URL must see “Access denied,” and the customer must remain undeleted.

Now consider this illustrative test:

```ts
test('viewer cannot delete customer', async ({ page }) => {
  // Assume a viewer session and an existing customer.
  await page.goto('/customers/42/delete');
  await expect(
    page.getByRole('heading', { name: 'Customers' })
  ).toBeVisible();
});
```

The heading assertion might pass. Neither access denial nor customer preservation has been checked.

Playwright is doing its job: evaluating the assertion we wrote. Its [assertion API](https://playwright.dev/docs/test-assertions) gives us ways to check expected conditions. Choosing a condition that represents the requirement remains our responsibility.

That distinction became the starting point for **Jev Scope QA**.

## The idea grew out of an agentic testing workflow

My exploration started with a practical workflow: provide an AI coding agent with epic documents, Jira acceptance criteria, developer scope and Markdown instructions, then ask it to produce scenarios and Playwright tests.

I wanted to examine the review step that follows generation.

Could a separate evaluation layer help a QA lead or principal engineer find:

- A scenario inventory that misses an acceptance criterion?
- Two scenarios that describe the same behavior in different words?
- A test whose assertions do not verify the behavior promised by its title?
- A requirement conflict that needs a person to resolve it?

Jev was interesting because TypeSafe documents uses around harness engineering, verification and semantic code linting. Those categories suggested a testing experiment. They were not evidence that Jev would already be reliable for my particular examples. [TypeSafe use-case map](https://docs.typesafe.ai/concepts/use-case-map)

## Why use another model when a skill file can describe the review?

A Markdown file or agent skill can absolutely define these review rules. The existing coding agent can follow them and perform the review.

The question I wanted to explore was narrower: could I turn specific review questions into repeatable API calls with defined answer choices, then measure the results?

That is the role I gave Jev. The coding agent prepares the evidence, Jev supplies a bounded assessment, and application code handles validation, routing and reporting. The lead still makes the review decision.

I have not established that this arrangement is more accurate, cheaper or faster than using the original agent. That comparison needs its own evaluation.

## Review the plan first, then the implementation

I split the workflow into two stages.

**Scenario planning** compares each acceptance criterion with the supplied inventory of existing and proposed scenarios. It also compares scenario pairs for potential duplication.

**Implementation review** compares the criterion and agreed scenario plan with actual test and helper code. Supplied execution results remain visible, but a green run does not override a missing assertion.

The daily sequence is:

```text
Epic + ticket + team instructions + existing inventory
                         ↓
            Coding agent proposes scenarios
                         ↓
       Jev reviews coverage and possible duplication
                         ↓
              Lead agrees the scenario plan
                         ↓
      Existing harness implements and runs the tests
                         ↓
       Jev compares required outcomes with assertions
                         ↓
       Lead accepts, requests changes or clarifies
```

This keeps scenario quality and implementation quality separate. A well-written scenario can still produce a weak test. A complete implementation cannot resolve an undefined requirement.

## What counts as a useful finding?

For a missing editor workflow, the useful finding is a specific coverage gap against the ticket.

For two viewer-denial scenarios, it is a duplicate candidate supported by matching roles, preconditions, actions and expected outcomes. Similar titles alone are not enough. A different role or boundary can justify a separate test.

For a referenced assertion helper whose code was not supplied, the useful result is “insufficient evidence.” Its name does not prove what it checks.

I used stage-specific choices such as `supported`, `coverage_gap`, `assertion_gap`, `duplicate_candidate`, `distinct`, `ambiguous_scope` and `insufficient_evidence`.

The TypeScript integration calls Jev through Vercel AI Gateway using the AI SDK's experimental evaluation API. The SDK supports typed evaluation questions; this project uses a Choice question for each check. [Vercel evaluation documentation](https://vercel.com/docs/ai-gateway/modalities/evaluation)

The readable notes in the report are local templates selected by the structured finding. They are not free-form explanations generated by Jev.

## An early result changed the rubric

The first version asked separate questions for a verdict and its reason. On three examples, Jev returned a positive verdict but a reason indicating missing evidence.

That was a useful design failure to encounter. The application could detect disagreement, but the output made review harder.

In the revised version, each check returns one primary finding. Code derives the recommendation and note from that finding. This removes that particular source of internal contradiction; it does not make the model's interpretation correct by definition.

A selected-finding probability below the provisional threshold of 0.80 routes to human judgment. That threshold is an initial policy choice, not a calibrated guarantee of correctness.

## What the live experiment actually showed

The revised synthetic benchmark contained **13 checks**. All 13 model requests completed, and **11 raw findings matched the expected finding labels**.

The useful detections included:

- The passing-but-ineffective viewer test: `assertion_gap`.
- The missing editor scenario: `coverage_gap`.
- The two equivalent viewer scenarios: `duplicate_candidate`.
- The viewer and administrator scenarios: `distinct`.
- The unavailable assertion helper: `insufficient_evidence`.

The two disagreements remain in the repository and report:

1. For omitted editor assertions in a declared complete implementation set, I expected `assertion_gap`. Jev selected `insufficient_evidence`.
2. For undefined export permissions, I expected `ambiguous_scope`. Jev selected `assertion_gap`, with a low probability that triggered human review.

The adequate administrator test also selected `supported` with only 0.53 probability, so the local policy sent it to human review.

![Recorded review-stage outcomes from the synthetic benchmark](../assets/review-stages.png)

*The bars show routed recommendations: five supported/distinct, three flagged, and five requiring human judgment. These are not browser test pass rates.*

There is a crucial limitation: these were **real Jev calls over authored synthetic evidence**. The embedded browser run records were illustrative, not results of executing those example tests. The expected labels are my evaluation labels, not an independently audited standard.

Eleven out of thirteen is a result to investigate. It is too small a sample to establish production reliability.

## Make the lead's review concrete

The report connects each criterion to scenario links, planning findings, implementation findings and the supplied evidence.

A reviewer can inspect the original requirement, compare the scenarios, read the actual assertions and see the model's probability distribution. Benchmark disagreements are explicitly marked.

Lead decisions are stored separately from model findings and tied to a specific run. Changing the evidence produces a new run without inheriting old approvals. The local reviewer workflow is a downloaded decision file followed by a CLI import; it is not an authenticated enterprise approval service.

The project also keeps unknowns visible. An incomplete inventory is different from a confirmed missing scenario. An API failure is different from a neutral judgment. A duplication candidate never automatically deletes a test.

## What I want to evaluate next

The next useful dataset would contain independently reviewed real tickets, genuine near-duplicates, missing helper evidence and difficult requirement conflicts.

I would measure missed gaps, false alarms and reviewer effort—not just overall label agreement. I would also compare Jev against the existing agent following the same review rubric.

The current integration boundary is deliberately explicit: an agent or harness supplies a normalized JSON snapshot. There is no automatic Jira importer, repository crawler or Playwright-result importer in this version. Pairwise duplication checks are scoped to one work item and capped with the other requests at 100 per run.

The experiment has given me a more precise question to ask about generated tests:

**Can I trace this requirement to an assertion that would fail if the required behavior were broken?**

Jev Scope QA is one way to investigate that question while keeping the evidence and human judgment visible.

Project: [github.com/balajiregt/jev-scope-qa](https://github.com/balajiregt/jev-scope-qa)

The repository includes the synthetic inputs, expected labels, recorded model results, an offline sample report and instructions for running your own evaluation.
