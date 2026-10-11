(() => {
  const runs = JSON.parse(document.getElementById('report-data').textContent);
  const labels = ['positive', 'negative', 'neutral'];
  const colors = { positive: '#177457', negative: '#be493b', neutral: '#98640d' };
  let active = 0, selected = 0, filter = null;
  const $ = id => document.getElementById(id);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  const expectedFor = (run, row) => (run.gold || []).find(g => g.caseId === row.caseId && g.criterionId === row.criterionId);
  const percentage = n => n == null ? 'Not measured' : `${(n * 100).toFixed(1)}%`;
  function stats(run) {
    const s = run.summary;
    const metrics = [
      ['Raw Jev agreement', s.rawMatchesOutOfRequested || 'Unlabeled', s.rawAccuracyOnCompleted == null ? 'No benchmark accuracy available' : percentage(s.rawAccuracyOnCompleted) + ' of completed judgments'],
      ['Human review', String(s.humanReviews), 'Final neutral decisions'],
      ['Completed', `${s.evaluated}/${s.requested}`, 'Actual model evaluations'],
      ['Operational errors', String(s.errors), `${s.notRun} requests not run`]
    ];
    $('stats').replaceChildren(...metrics.map(([label, value, note]) => {
      const block = element('div', undefined, 'stat');
      block.append(element('div', label, 'stat-label'), element('div', value, 'stat-number'), element('div', note, 'stat-note'));
      return block;
    }));
  }
  function drawFlow(run) {
    const scene = $('flow');
    scene.replaceChildren();
    scene.style.gridTemplateColumns = `repeat(${run.graph.stages.length}, minmax(120px, 1fr))`;
    const stageLabels = { expected: '01 / Expected label', raw: '02 / Raw Jev verdict', final: '03 / Local review decision' };
    run.graph.stages.forEach(stage => {
      const column = element('div');
      column.append(element('div', stageLabels[stage], 'stage-heading'));
      labels.forEach(label => {
        const button = element('button', undefined, `flow-node ${label}`);
        button.type = 'button';
        button.dataset.node = `${stage}:${label}`;
        button.setAttribute('aria-pressed', String(filter?.stage === stage && filter?.label === label));
        button.setAttribute('aria-label', `${stageLabels[stage]} ${label}: ${run.graph.counts[stage][label]} judgments. Filter cases.`);
        button.append(element('span', label[0].toUpperCase() + label.slice(1)), element('strong', String(run.graph.counts[stage][label])));
        button.onclick = () => { filter = { stage, label }; selected = -1; drawFlow(run); listCases(run); };
        column.append(button);
      });
      scene.append(column);
    });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    scene.prepend(svg);
    const drawLinks = () => {
      svg.replaceChildren();
      const base = scene.getBoundingClientRect();
      run.graph.links.forEach(link => {
        const a = [...scene.querySelectorAll('[data-node]')].find(n => n.dataset.node === link.from).getBoundingClientRect();
        const b = [...scene.querySelectorAll('[data-node]')].find(n => n.dataset.node === link.to).getBoundingClientRect();
        const x1 = a.right - base.left, y1 = a.top + a.height / 2 - base.top;
        const x2 = b.left - base.left, y2 = b.top + b.height / 2 - base.top;
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1 + 45} ${y1}, ${x2 - 45} ${y2}, ${x2} ${y2}`);
        path.setAttribute('stroke', colors[link.from.split(':')[1]]);
        path.setAttribute('stroke-width', String(2 + 3 * link.value));
        path.setAttribute('stroke-opacity', '.28');
        path.setAttribute('fill', 'none');
        svg.append(path);
      });
    };
    window.requestAnimationFrame(drawLinks);
    window.onresize = drawLinks;
    $('flow-note').textContent = `${run.summary.evaluated} completed judgments shown. Link width represents count. ${run.summary.errors + run.summary.notRun} failed or unattempted requests are excluded. ` + (run.gold ? '' : 'Expected labels are unavailable for this review.');
  }
  function matrix(run) {
    $('matrix').replaceChildren();
    const values = run.summary.confusionMatrix;
    if (!values) { $('matrix').append(element('p', 'This is an unlabeled harness review. Its verdicts have not been independently scored for accuracy.', 'empty')); return; }
    const table = element('table', undefined, 'matrix');
    const caption = element('caption', 'Confusion matrix: expected labels versus raw Jev verdicts');
    caption.style.fontSize = '12px';
    caption.style.marginBottom = '8px';
    table.append(caption);
    const head = element('tr'); head.append(element('th', 'Expected ↓ / Jev →'));
    labels.forEach(label => head.append(element('th', label)));
    table.append(head);
    labels.forEach(expected => {
      const row = element('tr'); const heading = element('th', expected); heading.scope = 'row'; row.append(heading);
      labels.forEach(actual => row.append(element('td', String(values[expected][actual]), values[expected][actual] ? expected === actual ? 'match' : 'mismatch' : '')));
      table.append(row);
    });
    $('matrix').append(table);
  }
  function routing(run) {
    const routes = [
      ['model_decision', 'Jev explicitly chose neutral'],
      ['inconsistent_answers', 'Verdict and reason disagree'],
      ['low_probability', 'Below probability threshold']
    ];
    const count = run.summary.evaluated;
    $('routing').replaceChildren(...routes.map(([key, label]) => {
      const n = run.rows.filter(row => row.status === 'evaluated' && row.decision === 'neutral' && row.routingReason === key).length;
      const row = element('div', undefined, 'routing-row'), top = element('div', undefined, 'routing-label');
      top.append(element('span', label), element('strong', String(n)));
      const track = element('div', undefined, 'bar-track'), fill = element('div', undefined, 'bar-fill');
      fill.style.width = `${count ? n / count * 100 : 0}%`; track.append(fill); row.append(top, track); return row;
    }));
    $('routing').append(element('p', `Threshold: ${run.provisionalThreshold ?? 0.8}. Provisional policy; not a correctness guarantee.`, 'caption'));
  }
  function listCases(run) {
    const query = $('search').value.toLowerCase();
    const matching = run.rows.map((row, index) => ({ row, index })).filter(({ row }) => {
      const expected = expectedFor(run, row)?.verdict;
      const stageValue = filter?.stage === 'expected' ? expected : filter?.stage === 'raw' ? row.rawVerdict : row.decision;
      return (!filter || row.status === 'evaluated' && stageValue === filter.label)
        && `${row.caseId} ${row.criterionId} ${row.answers?.reason?.choice || ''} ${row.rawVerdict || ''} ${row.decision || ''}`.toLowerCase().includes(query);
    });
    if (!matching.some(item => item.index === selected)) selected = matching[0]?.index ?? -1;
    $('filter-status').textContent = `${matching.length} of ${run.rows.length} records${filter ? ` · ${filter.stage}: ${filter.label}` : ''}`;
    $('case-list').replaceChildren(...matching.map(({ row, index }) => {
      const button = element('button', undefined, 'case-button'); button.type = 'button'; button.setAttribute('aria-pressed', String(index === selected));
      button.append(element('div', `${row.caseId} / ${row.criterionId}`, 'case-id'));
      button.append(element('div', row.status === 'evaluated' ? `Jev: ${row.rawVerdict} → Final: ${row.decision}` : `${row.status}: ${row.errorCode}`, 'case-path'));
      const expected = expectedFor(run, row)?.verdict;
      button.append(element('div', expected ? `Expected: ${expected}${row.status === 'evaluated' ? row.rawVerdict === expected ? ' · Match' : ' · Disagreement' : ''}` : 'Unlabeled review', 'case-note'));
      button.onclick = () => { selected = index; listCases(run); }; return button;
    }));
    if (!matching.length) $('case-list').append(element('p', 'No matching cases.', 'empty'));
    details(run, selected);
  }
  function details(run, index) {
    const panel = $('details'); panel.replaceChildren();
    const row = run.rows[index];
    if (!row) { panel.append(element('p', 'Select a case or clear the filter.', 'empty')); return; }
    const expected = expectedFor(run, row);
    const item = (run.reviewItems || []).find(item => item.caseId === row.caseId && item.criterionId === row.criterionId);
    panel.append(element('h2', `${row.caseId} / ${row.criterionId}`));
    if (item) {
      if (item.ticket) panel.append(element('h3', 'Ticket scope'), element('p', item.ticket));
      if (item.developerScope) panel.append(element('h3', 'Developer scope'), element('p', item.developerScope));
      panel.append(element('h3', 'Criterion'), element('p', item.criterion));
      panel.append(element('h3', 'Scenario evidence'));
      const list = element('ol'); item.scenarios.forEach(s => list.append(element('li', s))); panel.append(list);
    }
    if (row.status !== 'evaluated') {
      panel.append(element('p', `${row.status}: ${row.errorCode}. No model judgment was returned.`, 'error-note')); return;
    }
    const pills = element('div');
    pills.append(element('span', `Jev: ${row.rawVerdict}`, `pill ${row.rawVerdict}`), element('span', `Final: ${row.decision}`, `pill ${row.decision}`));
    panel.append(pills, element('p', row.note), element('p', 'Note source: local template. Jev returned the structured reason below.', 'legend-note'));
    panel.append(element('h3', 'Structured reason'), element('p', row.answers.reason.choice));
    panel.append(element('h3', 'Jev verdict probabilities'));
    labels.forEach(label => {
      const value = row.answers.verdict.probabilities[label];
      const bar = element('div', undefined, `prob-row ${label}`), track = element('div', undefined, 'prob-track'), fill = element('div', undefined, 'prob-fill'), threshold = element('div', undefined, 'threshold');
      fill.style.width = `${value * 100}%`; threshold.style.left = `${(run.provisionalThreshold ?? .8) * 100}%`;
      track.append(fill, threshold); bar.append(element('span', label), track, element('strong', `${(value * 100).toFixed(1)}%`)); panel.append(bar);
    });
    panel.append(element('p', 'Dashed line: local routing threshold. Bars show the model distribution, not measured correctness.', 'legend-note'));
    if (expected) panel.append(element('h3', `Expected: ${expected.verdict}`), element('p', expected.rationale));
    panel.append(element('p', `Routing: ${row.routingReason} · ${(row.elapsedMs / 1000).toFixed(2)} seconds · Input tokens: ${row.usage?.inputTokens ?? 'unavailable'} · Output tokens: ${row.usage?.outputTokens ?? 'unavailable'}`, 'detail-meta'));
  }
  function render() {
    const run = runs[active];
    $('runs').replaceChildren(...runs.map((r, index) => {
      const button = element('button', r.title); button.type = 'button'; button.setAttribute('aria-pressed', String(active === index));
      button.onclick = () => { active = index; selected = 0; filter = null; $('search').value = ''; render(); }; return button;
    }));
    $('metadata').textContent = `${run.model || 'typesafe-ai/jev'} · ${run.rubricVersion || 'scope-coverage-v1'} · ${run.generatedAt ? new Date(run.generatedAt).toLocaleString() : 'Saved evaluation'} · ${run.gold ? 'Labeled synthetic benchmark' : 'Existing harness evidence'}`;
    stats(run); drawFlow(run); matrix(run); routing(run); listCases(run);
  }
  $('search').oninput = () => listCases(runs[active]);
  $('clear-filter').onclick = () => { filter = null; $('search').value = ''; render(); };
  if (runs.length) render();
})();
