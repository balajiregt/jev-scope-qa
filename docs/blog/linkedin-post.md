Two decisions I want to improve in an agentic Playwright framework:

1. Are our tests actually covering the requirements?
2. Which tests should form the smoke suite from the full E2E inventory?

I’m shaping an experiment around local Laya versus OpenAI Decisions, using the existing agent + MD/skill review as a baseline.

For requirement coverage:
Acceptance criteria + test/helper assertions → covered, partial, uncovered or needs judgment.

For smoke selection:
Test behavior + critical journeys + dependencies + duration/reliability + runtime budget → include, exclude or needs judgment.

Then validate the proposed suite as a whole. A short test is not automatically smoke-worthy, and excluding a flaky critical test can hide an essential journey.

What I want to measure:
• Coverage: gap precision/recall and false-covered findings.
• Smoke: critical journeys retained, missed journeys and runtime reduction.
• Both: latency, cost, reliability and reviewer effort.

The lead reviews recommendations; Playwright executes tests. Several smoke suites may be valid—the goal is useful coverage within the budget.

Scope defined; Laya integration and these two workflows are next. No measured comparison claims yet.

Project: https://github.com/balajiregt/playwright-decision-bench

Planned results destination: https://framework-benchmarks-balaji.netlify.app/

#Playwright #TestAutomation #QualityEngineering #LocalAI
