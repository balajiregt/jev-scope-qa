import test from 'node:test';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildRequest, evaluateCriterion, routeAnswer } from '../src/evaluator.js';
import { answerSchema, casesSchema, goldSchema, type Answers, type Verdict } from '../src/schema.js';
import { confinedFile, ROOT, resolveContext } from '../src/context.js';
import { summarize, renderHtml, validateGold, type ReviewRow } from '../src/report.js';
import { gatewayErrorCode } from '../src/errors.js';
import { decisionGraph } from '../src/graph-report.js';

const cases = casesSchema.parse(JSON.parse(await readFile(path.join(ROOT, 'fixtures/benchmark-inputs.json'), 'utf8')));
const gold = goldSchema.parse(JSON.parse(await readFile(path.join(ROOT, 'fixtures/gold.json'), 'utf8')));
function answer(verdict: Verdict = 'positive', reason: Answers['reason']['choice'] = 'complete_coverage'): Answers {
  return { verdict: { type: 'choice', choice: verdict, probabilities: {
    positive: verdict === 'positive' ? 0.9 : 0.05, negative: verdict === 'negative' ? 0.9 : 0.05, neutral: verdict === 'neutral' ? 0.9 : 0.05
  } }, reason: { type: 'choice', choice: reason, probabilities: { [reason]: 1 } } };
}

test('benchmark has three examples per class and one gold label per criterion', () => {
  validateGold(cases.flatMap(c => c.criteria.map(a => ({ caseId: c.id, criterionId: a.id }))), gold);
  for (const label of ['positive', 'negative', 'neutral']) assert.equal(gold.filter(g => g.verdict === label).length, 3);
  assert.throws(() => validateGold([{ caseId: 'unknown', criterionId: 'AC-1' }], gold));
});

test('model packet excludes gold labels, benchmark IDs, filenames and extra fields', () => {
  const request = buildRequest({ ...cases[0], expected: 'LEAKED_GOLD', rationale: 'LEAKED_RATIONALE' } as typeof cases[number], 0);
  const serialized = JSON.stringify(request);
  assert.ok(!serialized.includes('LEAKED'));
  assert.ok(!serialized.includes(cases[0].id));
  assert.ok(!serialized.includes('gold.json'));
  assert.equal(request.state.criterion, cases[0].criteria[0].text);
  assert.deepEqual(Object.keys(request.state), ['ticket', 'developerScope', 'criterion', 'generatedScenarios', 'evidence']);
});

test('each criterion gets its own question state', () => {
  const item = { ...cases[0], criteria: [{ id: 'A', text: 'First criterion' }, { id: 'B', text: 'Second criterion' }] };
  assert.equal(buildRequest(item, 1).state.criterion, 'Second criterion');
  assert.throws(() => buildRequest(item, 3));
});

test('positive and negative decisions produce distinct templated notes', () => {
  assert.equal(routeAnswer(answer(), 0.8).decision, 'positive');
  const negative = routeAnswer(answer('negative', 'missing_assertion'), 0.8);
  assert.equal(negative.decision, 'negative');
  assert.match(negative.note, /missing action or assertion/);
  assert.equal(negative.noteSource, 'local template selected by structured answer');
});

test('explicit neutral requires human judgment', () => {
  const decision = routeAnswer(answer('neutral', 'conflicting_scope'), 0.8);
  assert.equal(decision.requiresHuman, true);
  assert.equal(decision.routingReason, 'model_decision');
});

test('uncertain or inconsistent answers cannot be routed as positive', () => {
  const weak = answer();
  weak.verdict.probabilities = { positive: 0.45, negative: 0.3, neutral: 0.25 };
  assert.equal(routeAnswer(weak, 0.8).routingReason, 'low_probability');
  assert.equal(routeAnswer(weak, 0.8).decision, 'neutral');
  assert.equal(routeAnswer(answer('positive', 'missing_assertion'), 0.8).routingReason, 'inconsistent_answers');
});

test('invalid model shapes and invalid thresholds are rejected', () => {
  assert.throws(() => answerSchema.parse({ verdict: { choice: 'positive' } }));
  const malformed = answer();
  malformed.verdict.probabilities.positive = 2;
  assert.throws(() => answerSchema.parse(malformed));
  assert.throws(() => routeAnswer(answer(), NaN));
});

test('model disagreement stays a failure; API errors are not neutral model judgments', async () => {
  // Deliberately wrong mock prediction for a known-negative case.
  const row = await evaluateCriterion(cases[3], 0, 0.8, async () => ({ answers: answer() }));
  const rows: ReviewRow[] = [row, { caseId: cases[6].id, criterionId: 'AC-1', status: 'error', errorCode: 'http_401' }];
  const summary = summarize(rows, gold);
  assert.equal(summary.rawAccuracyOnCompleted, 0);
  assert.equal(summary.falsePositiveApprovals, 1);
  assert.equal(summary.errors, 1);
  assert.equal(summary.allExpectedMatched, false);
  assert.equal(summary.confusionMatrix?.negative.positive, 1);
  assert.equal(summary.confusionMatrix?.neutral.neutral, 0);
});

test('HTML escapes evidence-derived identifiers', () => {
  const rows: ReviewRow[] = [{ caseId: '<script>alert(1)</script>', criterionId: 'AC-1', status: 'error', errorCode: 'bad_request' }];
  const html = renderHtml(rows, summarize(rows));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('\\u003cscript\\u003e'));
});

test('graph shows raw-to-neutral routing and excludes operational errors', async () => {
  const row = await evaluateCriterion(cases[0], 0, 0.8, async () => ({ answers: answer('positive', 'missing_evidence') }));
  const graph = decisionGraph([row, { caseId: 'case-02', criterionId: 'AC-1', status: 'error', errorCode: 'http_403' }], gold);
  assert.equal(graph.counts.expected.positive, 1);
  assert.equal(graph.counts.raw.positive, 1);
  assert.equal(graph.counts.final.neutral, 1);
  assert.deepEqual(graph.links.find(link => link.from === 'raw:positive'), { from: 'raw:positive', to: 'final:neutral', value: 1 });
});

test('unlabeled graph omits expected labels rather than treating them as neutral', () => {
  const graph = decisionGraph([]);
  assert.deepEqual(graph.stages, ['raw', 'final']);
  assert.equal(graph.counts.expected, undefined);
  assert.equal(graph.links.length, 0);
});

test('unattempted requests are separate from API failures and predictions', () => {
  const rows: ReviewRow[] = [
    { caseId: 'case-01', criterionId: 'AC-1', status: 'error', errorCode: 'billing_verification_required' },
    { caseId: 'case-02', criterionId: 'AC-1', status: 'not_run', errorCode: 'not_run_after_gateway_error' }
  ];
  const summary = summarize(rows, gold);
  assert.equal(summary.errors, 1);
  assert.equal(summary.notRun, 1);
  assert.equal(summary.evaluated, 0);
  assert.equal(summary.rawAccuracyOnCompleted, null);
});

test('Gateway error reporting never returns arbitrary provider messages', () => {
  assert.equal(gatewayErrorCode({ statusCode: 403, message: 'AI Gateway requires a valid credit card on file to service requests.' }), 'billing_verification_required');
  assert.equal(gatewayErrorCode({ statusCode: 401, message: 'secret-key-must-not-appear' }), 'http_401');
  assert.equal(gatewayErrorCode({ message: 'secret-key-must-not-appear' }), 'request_failed');
});

test('evidence resolver rejects secret files and symlinks escaping the allowed root', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'jev-evidence-test-'));
  const outside = await mkdtemp(path.join(tmpdir(), 'jev-outside-test-'));
  try {
    await writeFile(path.join(dir, '.env.local'), 'NOT_A_REAL_KEY=value');
    await writeFile(path.join(outside, 'external.ts'), 'unrelated content');
    await symlink(path.join(outside, 'external.ts'), path.join(dir, 'linked.ts'));
    await assert.rejects(confinedFile(dir, '.env.local'));
    await assert.rejects(confinedFile(dir, 'linked.ts'));
  } finally { await rm(dir, { recursive: true }); await rm(outside, { recursive: true }); }
});

test('optional local CRM harness adapter loads test, assertion and page evidence with hashes', {
  skip: !existsSync(path.join(ROOT, 'contexts/harness.local.yml')) && 'Local CRM harness is not configured; standalone checks do not require it'
}, async () => {
  const resolved = await resolveContext('contexts/harness-task.yml');
  assert.equal(resolved.cases[0].evidence.length, 3);
  assert.equal(resolved.provenance.evidenceFiles.length, 3);
  assert.ok(resolved.cases[0].evidence.some(e => e.content.includes('expectPermissionDenied')));
  assert.ok(resolved.provenance.evidenceFiles.every(e => e.sha256.length === 64));
});
