# Local Laya and OpenAI Decisions — comparison plan

Start with [the two use cases and measurement plan](evaluation-scope.md):
requirement-to-test coverage and smoke-suite selection.

Both models should assess the same bounded evidence, rubric and allowed outcomes.
Provider-specific adapters will normalize responses into finding, probabilities,
confidence, usage, timing and operational status. This adapter contract is planned;
current previews only show a normalized representation for offline review.

| Use case | Planned categories | Downstream decision |
|---|---|---|
| Requirement coverage | covered, partial, uncovered, needs judgment | Lead verifies evidence links and addresses confirmed gaps. |
| Smoke selection | include, exclude, needs judgment | Local logic checks critical journeys, dependencies and runtime; lead agrees the suite. |

Do not assume one provider's JSON is another provider's native wire format.
Laya requires its own checkpoint and a verified local serving setup. The existing
Ollama/Qwen model can be the agent/skill baseline. Hosting and hardware costs must
be recorded separately from provider charges; open weights do not imply zero cost.

## Available now

`npm run compare:preview` produces an offline HTML/JSON preview of shared evidence.
The current scaffold uses earlier planning/assertion/duplication rubrics, not yet
the final coverage/smoke contracts above. Unit tests inject normalized results to
validate metrics, abstention and error handling. No live CLI or publisher is enabled.

## Next implementation

Verify local Laya loading and token limits, implement both adapters, create held-out
coverage and smoke datasets, and add whole-suite constraints and per-use-case metrics.
Then extend the public dashboard's schema for validated aggregates. Do not publish
an accuracy or speed comparison until matching runs complete.

Sources: [Laya weights](https://huggingface.co/convaiinnovations/laya/tree/main),
[Laya project](https://github.com/NandhaKishorM/laya),
[OpenAI Decisions](https://developers.openai.com/api/docs/guides/decisions).
