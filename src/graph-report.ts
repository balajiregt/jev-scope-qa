import { readFileSync } from 'node:fs';
import { verdicts, type Gold, type Verdict } from './schema.js';
import type { ReviewRow, summarize } from './report.js';

export interface GraphRun {
  title: string;
  generatedAt?: string;
  model?: string;
  rubricVersion?: string;
  provisionalThreshold?: number;
  summary: ReturnType<typeof summarize>;
  rows: ReviewRow[];
  gold?: Gold;
  reviewItems?: { caseId: string; criterionId: string; criterion: string; scenarios: string[]; ticket?: string; developerScope?: string }[];
}

// Links include only real completed model judgments. Missing gold labels never
// become neutral labels, and operational failures never enter outcome counts.
export function decisionGraph(rows: ReviewRow[], gold?: Gold) {
  const stages = gold ? ['expected', 'raw', 'final'] as const : ['raw', 'final'] as const;
  const counts: Record<string, Record<Verdict, number>> = {};
  for (const stage of stages) counts[stage] = { positive: 0, negative: 0, neutral: 0 };
  const links = new Map<string, { from: string; to: string; value: number }>();
  for (const row of rows) {
    if (row.status !== 'evaluated') continue;
    const expected = gold?.find(g => g.caseId === row.caseId && g.criterionId === row.criterionId)?.verdict;
    const values = { expected, raw: row.rawVerdict, final: row.decision };
    for (const stage of stages) if (values[stage]) counts[stage][values[stage]!]++;
    for (let i = 0; i < stages.length - 1; i++) {
      const from = values[stages[i]], to = values[stages[i + 1]];
      if (!from || !to) continue;
      const key = `${stages[i]}:${from}->${stages[i + 1]}:${to}`;
      const link = links.get(key) ?? { from: `${stages[i]}:${from}`, to: `${stages[i + 1]}:${to}`, value: 0 };
      link.value++;
      links.set(key, link);
    }
  }
  return { stages, counts, links: [...links.values()], labels: verdicts };
}

export function renderGraphReport(runs: GraphRun[]) {
  const data = JSON.stringify(runs.map(run => ({ ...run, graph: decisionGraph(run.rows, run.gold) })))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const css = readFileSync(new URL('./report-style.css', import.meta.url), 'utf8');
  const js = readFileSync(new URL('./report-client.js', import.meta.url), 'utf8');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jev evaluation report</title><style>${css}</style></head>
<body><main>
<header><div class="eyebrow">AGENTIC WORKSPACE / JEV LAYER</div><h1>From evidence to decisions.</h1>
<p class="intro">Explore what Jev decided, where local policy requested human review, and how the answers compare with the benchmark.</p></header>
<nav id="runs" aria-label="Evaluation runs"></nav>
<div id="metadata" class="metadata"></div><div id="stats" class="stats"></div>
<section><div class="section-title"><div><h2>Decision flow</h2><p>Follow the counts from expected labels through Jev to the final review decision. Select a node to inspect its cases.</p></div><button id="clear-filter" type="button">Show all cases</button></div>
<div class="scroll"><div id="flow" class="flow"></div></div><p id="flow-note" class="caption"></p></section>
<div class="chart-grid"><section><h2>Expected vs. Jev</h2><p class="caption">Rows are expected labels; columns are raw model verdicts. Diagonal cells are matches.</p><div id="matrix"></div></section>
<section><h2>Why human review?</h2><p class="caption">A neutral model verdict and a local policy intervention are counted separately.</p><div id="routing"></div></section></div>
<section><div class="section-title"><div><h2>Case explorer</h2><p id="filter-status" aria-live="polite"></p></div><label class="search">Find a case<input id="search" type="search" placeholder="Case, criterion or reason"></label></div>
<div class="explorer"><div id="case-list" aria-label="Evaluation cases"></div><article id="details" aria-live="polite"></article></div></section>
<footer>Live evaluation records only. Positive means demonstrated scenario coverage, not a passing browser test. Notes are local templates selected by structured answers. Selected-class probability is not a calibrated correctness guarantee.</footer>
</main><script id="report-data" type="application/json">${data}</script><script>${js}</script></body></html>`;
}
