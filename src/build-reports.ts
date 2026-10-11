import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildLeadReports } from './lead-report.js';
import { ROOT, digest } from './context.js';
import { casesSchema, goldSchema } from './schema.js';
import { summarize } from './report.js';
import { renderGraphReport, type GraphRun } from './graph-report.js';

// Re-render saved responses without invoking Jev or loading credentials.
const runs: GraphRun[] = [];
for (const prefix of ['benchmark', 'harness-review']) {
  const filename = path.join(ROOT, 'artifacts', `${prefix}.json`);
  if (!existsSync(filename)) continue;
  const saved = JSON.parse(await readFile(filename, 'utf8'));
  const gold = saved.gold ? goldSchema.parse(saved.gold) : prefix === 'benchmark'
    ? goldSchema.parse(JSON.parse(await readFile(path.join(ROOT, 'fixtures/gold.json'), 'utf8'))) : undefined;
  const run: GraphRun = {
    title: prefix === 'benchmark' ? 'Synthetic benchmark' : 'CRM harness review',
    generatedAt: saved.generatedAt, model: saved.model, rubricVersion: saved.rubricVersion,
    provisionalThreshold: saved.provisionalThreshold, rows: saved.rows,
    summary: summarize(saved.rows, gold), gold, reviewItems: saved.reviewItems
  };
  // Older reports lacked human-readable inputs. Enrich only from the identical
  // recorded input file; changed fixtures must not be represented as old input.
  if (!run.reviewItems && saved.provenance?.inputs?.path) {
    const input = await readFile(saved.provenance.inputs.path, 'utf8');
    if (digest(input) === saved.provenance.inputs.sha256) {
      const cases = casesSchema.parse(JSON.parse(input));
      run.reviewItems = cases.flatMap(item => item.criteria.map(c => ({ caseId: item.id, criterionId: c.id, criterion: c.text, scenarios: item.scenarios, ticket: item.ticket, developerScope: item.developerScope })));
    }
  }
  runs.push(run);
  await writeFile(path.join(ROOT, 'artifacts', `${prefix}.html`), renderGraphReport([run]));
}
if (runs.length) await writeFile(path.join(ROOT, 'artifacts', 'legacy-report.html'), renderGraphReport(runs));
const leadRuns = await buildLeadReports();
if (!leadRuns && runs.length) await writeFile(path.join(ROOT, 'artifacts', 'index.html'), renderGraphReport(runs));
if (!leadRuns && !runs.length) throw new Error('No reports. Run review:preview or review:benchmark first.');
console.log(`Built ${leadRuns} lead report(s), ${runs.length} legacy report(s). No API calls.`);
