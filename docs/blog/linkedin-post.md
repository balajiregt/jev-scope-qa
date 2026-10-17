A Playwright test can pass without verifying the acceptance criterion.

“Viewers cannot delete customers” is not covered by checking that the Customers heading appears.

I’m exploring that gap with Jev Scope QA. Here’s where the review layer fits:

Epic + Jira + MD instructions + existing scenarios
↓
Coding agent proposes scenarios
↓
Jev: coverage gaps + duplicate candidates
↓
Lead agrees the plan → agent writes tests → Playwright runs
↓
Jev: required outcomes versus actual assertions
↓
Evidence-linked report → lead decision

What goes into Jev?

State: requirements, scenarios and—for implementation review—test/helper code and supplied run evidence.
Questions: instructions plus a defined answer type.

• Noul: probability of “yes” (called boolean in Vercel’s AI SDK).
• Choice: a category plus its probabilities.
• Score: a rating against described, ordered levels.

This project uses Choice. For example: supported, assertion_gap, ambiguous_scope or insufficient_evidence.

An illustrative JSON answer excerpt:
{"choice":"assertion_gap","probabilities":{"supported":0.03,"assertion_gap":0.92,"ambiguous_scope":0.02,"insufficient_evidence":0.03}}

Our code validates the answer. Below 0.80 selected-choice probability goes to human judgment; otherwise, the finding determines the recommendation. Ambiguous scope and missing evidence still need a person. API errors remain errors.

Jev reviews evidence. The existing harness executes tests. The lead decides—no automatic approvals or test deletion.

Our September synthetic run matched 11 of 13 expected findings. Real Jev calls, illustrative browser-run records, and disagreements preserved. The threshold and results need broader validation.

Code + offline sample report: https://github.com/balajiregt/jev-scope-qa

#Playwright #TestAutomation #QualityEngineering #AgenticAI
