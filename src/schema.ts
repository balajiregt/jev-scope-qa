import { z } from 'zod';

export const verdicts = ['positive', 'negative', 'neutral'] as const;
export const verdictSchema = z.enum(verdicts);
export type Verdict = z.infer<typeof verdictSchema>;
export const reasons = {
  complete_coverage: 'The scenario explicitly exercises the criterion with the correct role and expected result.',
  missing_assertion: 'An essential action or assertion is absent, even if the title claims coverage.',
  wrong_role: 'The scenario exercises a different role from the criterion.',
  contradictory_expectation: 'The scenario expects behavior that contradicts a clear requirement.',
  ambiguous_requirement: 'The requirement lacks a decision needed to define the expected result.',
  missing_evidence: 'Referenced scenario or helper evidence needed for judgment was not supplied.',
  conflicting_scope: 'Ticket requirements and developer scope conflict; a human must resolve intent.'
} as const;
export type Reason = keyof typeof reasons;
export const reasonVerdict: Record<Reason, Verdict> = {
  complete_coverage: 'positive', missing_assertion: 'negative', wrong_role: 'negative',
  contradictory_expectation: 'negative', ambiguous_requirement: 'neutral',
  missing_evidence: 'neutral', conflicting_scope: 'neutral'
};
export const notes: Record<Reason, string> = {
  complete_coverage: 'Positive: supplied scenarios demonstrate this criterion. Execution still needs verification.',
  missing_assertion: 'Negative: add the missing action or assertion; a title or UI hint alone does not prove coverage.',
  wrong_role: 'Negative: add evidence for the role named by this criterion.',
  contradictory_expectation: 'Negative: the proposed expected result contradicts the requirement. Review the scenario.',
  ambiguous_requirement: 'Neutral: a human must clarify the expected behavior before coverage can be assessed.',
  missing_evidence: 'Neutral: supply the missing test or helper evidence before making a coverage decision.',
  conflicting_scope: 'Neutral: a human must reconcile ticket requirements and developer scope.'
};

const criterionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) }).strict();
export const caseSchema = z.object({
  id: z.string().min(1),
  ticket: z.string().min(1),
  developerScope: z.string().min(1),
  criteria: z.array(criterionSchema).min(1),
  scenarios: z.array(z.string()),
  evidence: z.array(z.object({ content: z.string().min(1) }).strict()).default([]),
  evidenceRefs: z.array(z.string()).default([])
}).strict();
export const casesSchema = z.array(caseSchema).min(1);
export type ReviewCase = z.infer<typeof caseSchema>;
export const goldSchema = z.array(z.object({
  caseId: z.string(), criterionId: z.string(), verdict: verdictSchema,
  rationale: z.string().min(1)
}).strict()).min(1);
export type Gold = z.infer<typeof goldSchema>;

const distribution = z.object({
  positive: z.number().min(0).max(1), negative: z.number().min(0).max(1), neutral: z.number().min(0).max(1)
}).strict().refine(p => Math.abs(p.positive + p.negative + p.neutral - 1) < 0.02, 'Probabilities must sum to one');
export const answerSchema = z.object({
  verdict: z.object({ type: z.literal('choice'), choice: verdictSchema, probabilities: distribution }),
  reason: z.object({
    type: z.literal('choice'), choice: z.enum(Object.keys(reasons) as [Reason, ...Reason[]]),
    probabilities: z.record(z.string(), z.number().min(0).max(1))
  })
});
export type Answers = z.infer<typeof answerSchema>;
