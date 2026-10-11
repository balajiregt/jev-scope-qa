import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { config as dotenv } from 'dotenv';
import { z } from 'zod';
import { ROOT, confinedFile, digest } from './context.js';
import { workItemsSchema, stages, buildChecks, runChecks, workflowGoldSchema, validateWorkflowGold, workflowSummary,
  workflowVersion, appendDecision, requestHash, type WorkflowReport, type Stage } from './workflow.js';
import { buildLeadReports } from './lead-report.js';

async function main() {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    input: { type: 'string', default: 'examples/lead-review.json' }, stage: { type: 'string' },
    gold: { type: 'string', default: 'fixtures/workflow-gold.json' },
    report: { type: 'string', default: 'artifacts/lead-review.json' }, 'decision-file': { type: 'string' }
  } });
  const command = positionals[0];
  if (positionals.length !== 1 || !['preview', 'live', 'benchmark', 'decide', 'report'].includes(command)) throw new Error('Use preview, live, benchmark, decide or report');
  if (command === 'report') { console.log(`Built ${await buildLeadReports()} lead report(s). No API calls.`); return; }
  if (command === 'decide') {
    if (!values['decision-file']) throw new Error('Supply --decision-file from the report download');
    const target = await confinedFile(path.join(ROOT, 'artifacts'), path.relative(path.join(ROOT, 'artifacts'), path.resolve(ROOT, values.report!)));
    if (!['lead-review.json', 'workflow-benchmark.json'].includes(path.basename(target))) throw new Error('Select a saved live workflow report');
    const report: WorkflowReport = JSON.parse(await readFile(target, 'utf8'));
    const decision = JSON.parse(await readFile(await confinedFile(ROOT, values['decision-file']), 'utf8'));
    if (!/^[a-f0-9]{64}$/.test(report.runId)) throw new Error('Invalid saved run identity');
    const updated = JSON.stringify(appendDecision(report, decision), null, 2);
    await writeFile(target, updated);
    await mkdir(path.join(ROOT, 'artifacts/history'), { recursive: true });
    await writeFile(path.join(ROOT, 'artifacts/history', `${report.runId}.json`), updated);
    await buildLeadReports();
    console.log('Reviewer decision appended to this exact run; model findings unchanged.');
    return;
  }
  if (values.stage && !stages.includes(values.stage as Stage)) throw new Error('Stage must be planning, duplication or implementation');
  const inputPath = await confinedFile(ROOT, values.input!);
  const input = await readFile(inputPath, 'utf8');
  const items = workItemsSchema.parse(JSON.parse(input));
  const checks = buildChecks(items, values.stage as Stage | undefined);
  if (!checks.length) throw new Error('No checks for this stage');
  const gold = command === 'benchmark' ? workflowGoldSchema.parse(JSON.parse(await readFile(await confinedFile(ROOT, values.gold!), 'utf8'))) : undefined;
  if (gold) validateWorkflowGold(checks, gold);
  const minimum = Number(process.env.JEV_MIN_PROBABILITY ?? '0.80');
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1) throw new Error('JEV_MIN_PROBABILITY must be from 0 to 1');
  await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  const report: WorkflowReport = {
    runId: digest(`${new Date().toISOString()}${input}${Math.random()}`), mode: command === 'preview' ? 'preview' : 'live',
    generatedAt: new Date().toISOString(), rubricVersion: workflowVersion, minimum, inputPath, inputHash: digest(input),
    items, checks, rows: [], gold, decisions: []
  };
  await writeFile(path.join(ROOT, 'artifacts/workflow-requests-preview.json'), JSON.stringify(checks.map(check => ({
    checkId: check.id, requestHash: requestHash(check), request: check.request
  })), null, 2));
  if (command !== 'preview') {
    if (!process.env.AI_GATEWAY_API_KEY?.trim()) delete process.env.AI_GATEWAY_API_KEY;
    dotenv({ path: path.join(ROOT, '.env.local'), quiet: true });
    if (!process.env.AI_GATEWAY_API_KEY?.trim()) throw new Error('Set AI_GATEWAY_API_KEY in .env.local; no model calls made');
    report.minimum = Number(process.env.JEV_MIN_PROBABILITY ?? '0.80');
    console.log(`Evaluating ${checks.length} checks through typesafe-ai/jev. Input: ${values.input}`);
    report.rows = await runChecks(checks, report.minimum);
  }
  const prefix = command === 'preview' ? 'lead-preview' : command === 'benchmark' ? 'workflow-benchmark' : 'lead-review';
  // Preserve snapshots so rebuilding or rerunning does not erase the reviewed evidence.
  const archive = path.join(ROOT, 'artifacts/history');
  await mkdir(archive, { recursive: true });
  const serialized = JSON.stringify({ ...report, requestHashes: checks.map(c => ({ checkId: c.id, sha256: requestHash(c) })) }, null, 2);
  await writeFile(path.join(archive, `${report.runId}.json`), serialized);
  await writeFile(path.join(ROOT, 'artifacts', `${prefix}.json`), serialized);
  await buildLeadReports();
  const summary = workflowSummary(checks, report.rows, gold);
  console.log(command === 'preview' ? `Preview: ${checks.length} requests; no model calls or invented findings.` : JSON.stringify(summary, null, 2));
  console.log(`Report: artifacts/${prefix}.html`);
  if (command !== 'preview' && (summary.errors || summary.notRun || (gold && summary.matched !== checks.length))) process.exitCode = 1;
}
main().catch(error => {
  console.error(error instanceof z.ZodError ? 'Input validation failed: check schema, unique IDs and references.' : error instanceof Error ? error.message : 'Workflow failed');
  process.exitCode = 1;
});
