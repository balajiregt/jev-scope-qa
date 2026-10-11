import { renderGraphReport } from './graph-report.js';
import { verdicts, type Gold, type Verdict } from './schema.js';
import type { evaluateCriterion } from './evaluator.js';

export type ReviewRow = Awaited<ReturnType<typeof evaluateCriterion>> | {
  caseId: string; criterionId: string; status: 'error' | 'not_run'; errorCode: string;
};
export const rowKey = (row: { caseId: string; criterionId: string }) => JSON.stringify([row.caseId, row.criterionId]);

export function validateGold(rows: { caseId: string; criterionId: string }[], gold: Gold) {
  const keys = gold.map(rowKey);
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate gold label');
  for (const row of rows) if (!keys.includes(rowKey(row))) throw new Error('Missing gold label for selected criterion');
}

export function summarize(rows: ReviewRow[], gold?: Gold) {
  const confusion = Object.fromEntries(verdicts.map(expected => [expected, Object.fromEntries(verdicts.map(actual => [actual, 0]))])) as Record<Verdict, Record<Verdict, number>>;
  let evaluated = 0, rawMatches = 0, routedMatches = 0, falsePositiveApprovals = 0, humanReviews = 0;
  for (const row of rows) {
    if (row.status !== 'evaluated') continue;
    evaluated++;
    if (row.requiresHuman) humanReviews++;
    const expected = gold?.find(g => rowKey(g) === rowKey(row));
    if (!expected) continue;
    confusion[expected.verdict][row.rawVerdict]++;
    if (row.rawVerdict === expected.verdict) rawMatches++;
    if (row.decision === expected.verdict) routedMatches++;
    if (row.decision === 'positive' && expected.verdict !== 'positive') falsePositiveApprovals++;
  }
  return {
    requested: rows.length, evaluated, errors: rows.filter(row => row.status === 'error').length,
    notRun: rows.filter(row => row.status === 'not_run').length, humanReviews,
    rawAccuracyOnCompleted: gold && evaluated ? rawMatches / evaluated : null,
    routedAccuracyOnCompleted: gold && evaluated ? routedMatches / evaluated : null,
    rawMatchesOutOfRequested: gold ? `${rawMatches}/${rows.length}` : null,
    falsePositiveApprovals: gold ? falsePositiveApprovals : null,
    confusionMatrix: gold ? confusion : null,
    allExpectedMatched: gold ? evaluated === rows.length && rawMatches === rows.length : null
  };
}

export function renderHtml(rows: ReviewRow[], summary: ReturnType<typeof summarize>, gold?: Gold) {
  return renderGraphReport([{ title: gold ? 'Synthetic benchmark' : 'Harness review', rows, summary, gold }]);
}
