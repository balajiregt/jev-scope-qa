import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { config as dotenv } from 'dotenv';
import { z } from 'zod';
import { ROOT, resolveContext, selectCases, digest } from './context.js';
import { buildRequest, evaluateCriterion, MODEL, RUBRIC_VERSION } from './evaluator.js';
import { goldSchema } from './schema.js';
import { summarize, validateGold, type ReviewRow } from './report.js';
import { renderGraphReport } from './graph-report.js';
import { gatewayErrorCode } from './errors.js';

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    task: { type: 'string', default: 'contexts/task.yml' }, case: { type: 'string' }, repeat: { type: 'string', default: '1' }
  } });
  const command = positionals[0];
  if (positionals.length !== 1 || !['resolve', 'preview', 'benchmark', 'review'].includes(command)) {
    throw new Error('Use resolve, preview, benchmark or review; optional --task, --case and --repeat');
  }
  const context = await resolveContext(values.task!);
  const cases = selectCases(context.cases, values.case);
  const requests = cases.flatMap(item => item.criteria.map((_, index) => ({ caseId: item.id, criterionId: item.criteria[index].id, request: buildRequest(item, index) })));
  if (command === 'resolve') { console.log('Resolved current evidence paths and hashes in artifacts/resolved-context.yml'); return; }
  if (command === 'preview') {
    await writeFile(path.join(ROOT, 'artifacts/requests-preview.json'), JSON.stringify(requests, null, 2));
    console.log(`Previewed ${requests.length} requests. No model calls, responses or accuracy claims. See artifacts/requests-preview.json`);
    return;
  }
  const repeats = Number(values.repeat);
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 5) throw new Error('--repeat must be an integer from 1 to 5');
  if (requests.length * repeats > 100) throw new Error('Limit each live run to 100 requests');
  const gold = command === 'benchmark'
    ? goldSchema.parse(JSON.parse(await readFile(context.goldPath ?? (() => { throw new Error('Benchmark task needs gold labels'); })(), 'utf8')))
    : undefined;
  if (gold) validateGold(requests, gold);
  for (const file of [path.join(ROOT, '.env.local'), context.credentialFile]) {
    if (existsSync(file)) {
      // Blank placeholders must not mask a populated key in the existing harness.
      if (!process.env.AI_GATEWAY_API_KEY?.trim()) delete process.env.AI_GATEWAY_API_KEY;
      dotenv({ path: file, quiet: true, override: false });
    }
  }
  if (!process.env.AI_GATEWAY_API_KEY?.trim()) throw new Error('Set AI_GATEWAY_API_KEY in this project or the existing harness .env.local. No API calls made.');
  const minimum = Number(process.env.JEV_MIN_PROBABILITY ?? '0.80');
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1) throw new Error('JEV_MIN_PROBABILITY must be from 0 to 1');
  const rows: ReviewRow[] = [];
  evaluationLoop: for (let repeat = 0; repeat < repeats; repeat++) {
    for (const item of cases) for (const [index, criterion] of item.criteria.entries()) {
      try {
        const row = await evaluateCriterion(item, index, minimum);
        rows.push(row);
        console.log(`${item.id}/${criterion.id}: Jev=${row.rawVerdict}, routed=${row.decision}`);
      } catch (error) {
        // Never log raw API errors or request objects, which can contain secrets.
        const status = (error as { statusCode?: number })?.statusCode;
        const errorCode = error instanceof z.ZodError ? 'invalid_model_response' : gatewayErrorCode(error);
        rows.push({ caseId: item.id, criterionId: criterion.id, status: 'error', errorCode });
        console.log(`${item.id}/${criterion.id}: ${errorCode}`);
        // Fail fast on configuration, authentication, quota and rate-limit errors.
        if (status && [400, 401, 402, 403, 404, 429].includes(status)) {
          for (let n = rows.length; n < requests.length * repeats; n++) {
            const pending = requests[n % requests.length];
            rows.push({ caseId: pending.caseId, criterionId: pending.criterionId, status: 'not_run', errorCode: 'not_run_after_gateway_error' });
          }
          break evaluationLoop;
        }
      }
      if (rows.length >= requests.length * repeats) break;
    }
    if (rows.length >= requests.length * repeats) break;
  }
  const summary = summarize(rows, gold);
  const prefix = command === 'benchmark' ? 'benchmark' : 'harness-review';
  const reviewItems = cases.flatMap(item => item.criteria.map(c => ({
    caseId: item.id, criterionId: c.id, criterion: c.text, scenarios: item.scenarios,
    ticket: item.ticket, developerScope: item.developerScope
  })));
  await writeFile(path.join(ROOT, `artifacts/${prefix}.json`), JSON.stringify({
    mode: 'live', model: MODEL, rubricVersion: RUBRIC_VERSION, provisionalThreshold: minimum,
    generatedAt: new Date().toISOString(), repeats, provenance: context.provenance,
    requestHashes: requests.map(r => ({ caseId: r.caseId, criterionId: r.criterionId, sha256: digest(JSON.stringify(r.request)) })),
    summary, rows, gold, reviewItems
  }, null, 2));
  await writeFile(path.join(ROOT, `artifacts/${prefix}.html`), renderGraphReport([{
    title: command === 'benchmark' ? 'Synthetic benchmark' : 'CRM harness review',
    model: MODEL, rubricVersion: RUBRIC_VERSION, generatedAt: new Date().toISOString(),
    provisionalThreshold: minimum, rows, summary, gold, reviewItems
  }]));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Report: artifacts/${prefix}.html`);
  if (summary.errors || summary.notRun || (gold && !summary.allExpectedMatched)) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof z.ZodError ? 'Input validation failed; check the documented schema.' : error.message); process.exitCode = 1; });
