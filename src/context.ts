import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFile, realpath, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { z } from 'zod';
import { casesSchema, type ReviewCase } from './schema.js';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
const taskSchema = z.object({ name: z.string(), description: z.string(), inputs: z.string(), gold: z.string().optional() }).strict();
const harnessSchema = z.object({
  repository_topology: z.object({ evaluation_layer: z.string(), existing_harness: z.string(), mode: z.literal('read-only-evidence-adapter') }),
  credential_file: z.string(), evidence: z.record(z.string(), z.string()),
  next_step_commands: z.record(z.string(), z.string())
});
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');

export async function confinedFile(root: string, relative: string) {
  const realRoot = await realpath(root);
  const target = await realpath(path.resolve(root, relative));
  if (!target.startsWith(realRoot + path.sep)) throw new Error('File is outside the declared evidence root');
  if (!['.ts', '.json', '.yml', '.yaml', '.md'].includes(path.extname(target)) || path.basename(target).startsWith('.')) {
    throw new Error('Unsupported evidence file type');
  }
  return target;
}

export async function resolveContext(taskFile: string) {
  const taskPath = await confinedFile(ROOT, taskFile);
  const taskText = await readFile(taskPath, 'utf8');
  const task = taskSchema.parse(YAML.parse(taskText));
  const localHarness = path.join(ROOT, 'contexts/harness.local.yml');
  const harnessPath = existsSync(localHarness) ? localHarness : path.join(ROOT, 'contexts/harness.yml');
  const harness = harnessSchema.parse(YAML.parse(await readFile(harnessPath, 'utf8')));
  const inputPath = await confinedFile(ROOT, task.inputs);
  const inputText = await readFile(inputPath, 'utf8');
  const cases = casesSchema.parse(JSON.parse(inputText));
  if (cases.length > 100) throw new Error('Limit each run to 100 cases');
  const ids = new Set<string>();
  const evidenceFiles: { alias: string; path: string; sha256: string }[] = [];
  const harnessRoot = path.resolve(ROOT, harness.repository_topology.existing_harness);
  for (const item of cases) {
    if (ids.has(item.id)) throw new Error('Duplicate case ID');
    ids.add(item.id);
    if (new Set(item.criteria.map(c => c.id)).size !== item.criteria.length) throw new Error('Duplicate criterion ID');
    for (const alias of item.evidenceRefs) {
      const relative = harness.evidence[alias];
      if (!relative) throw new Error('Unknown evidence alias');
      const absolute = await confinedFile(harnessRoot, relative);
      const content = await readFile(absolute, 'utf8');
      item.evidence.push({ content });
      evidenceFiles.push({ alias, path: absolute, sha256: digest(content) });
    }
    if (Buffer.byteLength(JSON.stringify(item)) > 80_000) throw new Error('Evidence packet exceeds 80 KB; narrow the evidence');
  }
  const goldPath = task.gold ? await confinedFile(ROOT, task.gold) : undefined;
  const provenance = {
    generatedAt: new Date().toISOString(), task: { path: taskPath, sha256: digest(taskText), name: task.name },
    repository_topology: harness.repository_topology,
    inputs: { path: inputPath, sha256: digest(inputText) }, evidenceFiles,
    next_step_commands: harness.next_step_commands,
    note: 'Only listed evidence contents enter model state. Gold labels and command maps remain local.'
  };
  await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  await writeFile(path.join(ROOT, 'artifacts/resolved-context.yml'), YAML.stringify(provenance));
  return { task, cases, goldPath, provenance, credentialFile: path.resolve(ROOT, harness.credential_file) };
}

export function selectCases(cases: ReviewCase[], id?: string) {
  const selected = id ? cases.filter(item => item.id === id) : cases;
  if (!selected.length) throw new Error('Unknown case ID');
  return selected;
}
