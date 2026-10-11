A Playwright test can pass and still miss the acceptance criterion.

Example: “A viewer cannot delete a customer.”

The test opens the page, checks that the Customers heading is visible, and goes green. It never verifies access denial or that the customer remains.

That question led me to build Jev Scope QA—an experimental review layer around an agentic Playwright workflow.

The idea:

→ Copilot, Claude or another coding agent generates scenarios from the supplied epic, ticket and team instructions.
→ Jev reviews scenario coverage and potential duplication.
→ After implementation, Jev compares the required outcomes with actual test assertions.
→ A QA lead or principal engineer reviews the evidence and makes the decision.

In the first revised synthetic benchmark, 13 live Jev checks completed and 11 matched my expected finding labels. It caught the ineffective passing test, a missing role scenario and a duplicate pair. The disagreements and uncertain answers remain visible in the report.

That is an exploratory result—not a production accuracy claim. The example browser-run records are illustrative; the Jev calls are real.

The project includes an offline sample report, so you can inspect the findings without an API key.

Code and examples: https://github.com/balajiregt/jev-scope-qa

How do you currently check that AI-generated tests verify the requirement, beyond simply passing?

#Playwright #TestAutomation #QualityEngineering #AgenticAI
