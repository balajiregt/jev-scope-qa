import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './context.js';
import { renderLeadReports } from './lead-report.js';
import type { WorkflowReport } from './workflow.js';

// Reproduce the checked-in historical synthetic result without credentials or calls.
const sample: WorkflowReport = JSON.parse(await readFile(path.join(ROOT, 'examples/results/lead-review-2026-09-23.json'), 'utf8'));
await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
await writeFile(path.join(ROOT, 'artifacts/sample-report.html'), renderLeadReports([sample]));
console.log('Historical sample report: artifacts/sample-report.html. No API calls.');
