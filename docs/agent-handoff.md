# Agent and harness handoff

This is a workflow instruction document, not an executable model or an installed
workspace skill. The existing agent can follow it when preparing a lead review.

1. Read the approved work-item context through the existing harness workflow.
   Preserve epic, ticket, team instructions and developer scope as separate source
   records. Keep contradictions visible. Extract only explicit acceptance criteria;
   do not make a new product requirement from a guessed behavior.
2. Export the existing scenario inventory and generated proposals into the v2
   JSON format shown in `examples/lead-review.json`. Describe roles, preconditions,
   actions and expected outcomes. Mark inventory completeness honestly. Link
   scenario IDs to criteria without claiming the links prove coverage.
3. Leave `approvedScenarioIds` empty until a human has agreed the plan. Use
   `review:preview -- --input examples/your-review.json --stage planning` to inspect
   the outbound packet. Run live planning and duplication reviews only for evidence
   authorized for that external destination.
4. Present Jev findings and their evidence to the lead. Similar wording is not
   enough to delete a test. Preserve role/boundary coverage; uncertain duplication
   requires comparison, not automatic consolidation.
5. Record the agreed scenario IDs. Use the existing generator, page objects,
   assertions, mockserver and Playwright commands to implement and execute tests.
   This evaluator never runs those commands or changes the tests.
6. Export exact relevant test and helper code with source locations into
   `implementations`. Include all referenced assertion helpers; mark incomplete
   evidence if something is unavailable. Supply a real execution status and its
   report reference. Never label an unexecuted test as passed.
7. Preview and run the implementation review. A green Playwright status is one
   piece of evidence, not the criterion coverage result. Discuss missing assertions,
   disputed requirements and uncertain findings with the lead.
8. The lead records a per-check decision in the report, downloads it, then imports
   it with `review:decision`. Re-evaluate after changes; do not carry old approvals
   onto a new evidence snapshot. Keep the original findings for comparison.

Preview, report rebuilding and reviewer-decision import are offline. Live calls
send explicit supplied text/code through Vercel to TypeSafe. Do not copy keys,
credentials, personal data or unrelated repository files into review evidence.
