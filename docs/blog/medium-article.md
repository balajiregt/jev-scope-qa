# The Playwright Test Passed. Did It Test the Requirement?

*Where Jev fits in an agentic testing framework—and how its JSON becomes a review finding.*

A ticket says: “Viewers cannot delete customers.” An AI-generated test opens the page, asserts that the Customers heading is visible, and passes.

The assertion succeeded. Access denial was never verified.

That is the problem I’m exploring with **Jev Scope QA**: help leads review whether generated scenarios and assertions address the supplied requirements.

## Where the Jev layer fits

```text
Epic + Jira criteria + MD instructions + existing scenarios
                         ↓
        Coding agent proposes test scenarios
                         ↓
     JEV REVIEW 1: coverage gaps + duplicate candidates
                         ↓
              Lead agrees the plan
                         ↓
    Agent writes tests → Playwright executes them
                         ↓
     JEV REVIEW 2: requirements versus actual assertions
                         ↓
        Evidence-linked report → lead decision
```

Jev’s scope is specific:

- **Coverage:** does the inventory exercise the required roles, actions and outcomes?
- **Duplication:** do two scenarios test the same behavior, or do role/boundary differences justify both?
- **Assertion quality:** would the supplied assertions detect a violation of the criterion?

The existing harness still generates and runs tests. Jev supplies advisory findings; the lead approves, requests changes or clarifies scope. Today, the handoff is an explicit JSON snapshot, not automatic Jira ingestion.

## What do we send to Jev?

Two things: **state** (the evidence) and **typed questions** (what to evaluate).

State contains the relevant requirements and scenario inventory. Implementation reviews also include the agreed plan, test/helper code and supplied run results. Expected benchmark answers and reviewer decisions stay out of the request.

Three question types useful here:

| Type | Meaning | Possible QA question |
| --- | --- | --- |
| **Noul** | Probability that a yes/no proposition is true | “Is the required denial assertion present?” |
| **Choice** | Select a defined category, with probabilities | “Supported, assertion gap, ambiguous scope or missing evidence?” |
| **Score** | Rate against ordered, described levels | “How complete is this scenario against the rubric?” |

[Noul](https://docs.typesafe.ai/primitives/noul), [Choice](https://docs.typesafe.ai/primitives/choice) and [Score](https://docs.typesafe.ai/primitives/score) are question types—not the ticket data itself. In Vercel’s AI SDK interface, the yes/no type is `boolean`; native TypeSafe calls it `noul`. **This project uses Choice only.** [API formats](https://vercel.com/docs/ai-gateway/modalities/decision)

Here is a shortened implementation-review request:

```json
{
  "model": "typesafe-ai/jev",
  "state": "Criterion: viewer sees Access denied. Complete supplied test: opens the restricted URL and only asserts the Customers heading.",
  "questions": {
    "finding": {
      "type": "choice",
      "instructions": "Compare actual assertions with the criterion.",
      "criteria": {
        "supported": "Assertions verify the required outcome",
        "assertion_gap": "A required assertion is missing",
        "ambiguous_scope": "The requirement is unclear or conflicting",
        "insufficient_evidence": "Necessary evidence is unavailable"
      }
    }
  }
}
```

The real rubric includes additional rules and full evidence. Our pinned `ai@7.0.109` uses `experimental_evaluate`; newer Vercel documentation shows `experimental_decide`. Use the API matching your installed SDK.

## What comes back—and what do we do?

Illustrative answer excerpt, not a measured response:

```json
{
  "answers": {
    "finding": {
      "type": "choice",
      "choice": "assertion_gap",
      "probabilities": {
        "supported": 0.03,
        "assertion_gap": 0.92,
        "ambiguous_scope": 0.02,
        "insufficient_evidence": 0.03
      }
    }
  }
}
```

Our code validates the response and reads `probabilities[choice]`:

- **Below 0.80:** route to human judgment, retaining the raw finding.
- **Otherwise:** supported/distinct → positive; gap/duplicate candidate → flagged; ambiguous scope/missing evidence → human judgment.
- **API or schema error:** record an operational failure, never a coverage verdict.

So this example becomes a flagged assertion gap with a local explanatory note. It does not automatically fail the browser test or approve a release. The 0.80 threshold is provisional—not calibrated correctness or TypeSafe’s separate confidence field.

## What the experiment showed

Our September 23 synthetic run completed **13 live Jev checks; 11 matched the expected finding labels**. It detected the ineffective passing test, missing editor coverage and a duplicate pair. Two disagreements remain visible.

![Recorded review-stage outcomes](../assets/review-stages.png)

The Jev calls were real; the example browser-run records were illustrative. This is an exploratory result, not production validation.

[Explore the code, evidence and offline sample report](https://github.com/balajiregt/jev-scope-qa).
