const { z } = require('zod');
const { CASE_TYPES, COURTS, STAGES, STATUSES, PRIORITIES, RISK_LEVELS } = require('../constants/enums');

const isoDate = (label) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be a date string` })
    .trim()
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v)), `${label} must be a valid date (YYYY-MM-DD)`)
    .transform((v) => new Date(v));

const optionalDate = (label) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), isoDate(label).optional());

const text = (label, min, max) => z.string({ required_error: `${label} is required` }).trim().min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);

const sections = z
  .preprocess(
    (v) => (typeof v === 'string' ? v.split(/[;,\n]/).map((s) => s.trim()).filter(Boolean) : v),
    z.array(z.string().trim().min(1).max(120)).max(30, 'At most 30 legal sections'),
  )
  .optional()
  .default([]);

const count = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`)
    .max(5000, `${label} looks unrealistic (max 5000)`);

const baseCase = z.object({
  caseNumber: text('Case number', 3, 60).regex(/^[A-Za-z0-9/_.\- ]+$/, 'Case number may only contain letters, digits, / _ . -'),
  title: text('Case title', 3, 250),
  court: z.enum(COURTS, { errorMap: () => ({ message: `Court must be one of: ${COURTS.join(', ')}` }) }),
  state: text('State', 2, 60),
  district: z.string().trim().max(60).optional().default(''),
  caseType: z.enum(CASE_TYPES, { errorMap: () => ({ message: `Case type must be one of: ${CASE_TYPES.join(', ')}` }) }),
  filingDate: isoDate('Filing date'),
  currentStage: z.enum(STAGES, { errorMap: () => ({ message: `Stage must be one of: ${STAGES.join(', ')}` }) }),
  status: z.enum(STATUSES, { errorMap: () => ({ message: `Status must be one of: ${STATUSES.join(', ')}` }) }),
  priority: z.enum(PRIORITIES, { errorMap: () => ({ message: `Priority must be one of: ${PRIORITIES.join(', ')}` }) }),
  petitioner: text('Petitioner', 2, 200),
  respondent: text('Respondent', 2, 200),
  judge: z.string().trim().max(120).optional().default(''),
  numberOfHearings: count('Number of hearings'),
  numberOfAdjournments: count('Number of adjournments'),
  lastHearingDate: optionalDate('Last hearing date'),
  nextHearingDate: optionalDate('Next hearing date'),
  legalSections: sections,
  description: z.string().trim().max(5000, 'Description must be at most 5000 characters').optional().default(''),
  historicalData: z
    .array(z.object({ date: isoDate('History date'), event: text('Event', 2, 120), notes: z.string().trim().max(1000).optional() }))
    .max(500)
    .optional(),
});

const crossFieldChecks = (data, ctx) => {
  const now = new Date();
  if (data.filingDate && data.filingDate > now) ctx.addIssue({ path: ['filingDate'], code: 'custom', message: 'Filing date cannot be in the future' });
  if (data.filingDate && data.filingDate < new Date('1950-01-01')) ctx.addIssue({ path: ['filingDate'], code: 'custom', message: 'Filing date looks invalid (before 1950)' });
  if (data.lastHearingDate) {
    if (data.lastHearingDate > now) ctx.addIssue({ path: ['lastHearingDate'], code: 'custom', message: 'Last hearing date cannot be in the future' });
    if (data.filingDate && data.lastHearingDate < data.filingDate) ctx.addIssue({ path: ['lastHearingDate'], code: 'custom', message: 'Last hearing date cannot be before filing date' });
  }
  if (data.nextHearingDate) {
    if (data.filingDate && data.nextHearingDate < data.filingDate) ctx.addIssue({ path: ['nextHearingDate'], code: 'custom', message: 'Next hearing date cannot be before filing date' });
    if (data.lastHearingDate && data.nextHearingDate < data.lastHearingDate) ctx.addIssue({ path: ['nextHearingDate'], code: 'custom', message: 'Next hearing date must be after last hearing date' });
  }
  if (data.numberOfAdjournments !== undefined && data.numberOfHearings !== undefined && data.numberOfAdjournments > data.numberOfHearings) {
    ctx.addIssue({ path: ['numberOfAdjournments'], code: 'custom', message: 'Adjournments cannot exceed number of hearings' });
  }
};

const createCaseSchema = baseCase.strict().superRefine(crossFieldChecks);
// PUT replaces the editable fields; same rules as create.
const updateCaseSchema = baseCase.strict().superRefine(crossFieldChecks);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  riskLevel: z.enum([...RISK_LEVELS, 'UNASSESSED']).optional(),
  caseType: z.enum(CASE_TYPES).optional(),
  court: z.enum(COURTS).optional(),
  state: z.string().trim().max(60).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  from: optionalDate('From date'),
  to: optionalDate('To date'),
  sortBy: z.enum(['createdAt', 'filingDate', 'caseNumber', 'numberOfAdjournments', 'numberOfHearings', 'riskProbability', 'predictedDelayDays', 'nextHearingDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
const caseIdParamSchema = z.object({ caseId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid case id') });

module.exports = { createCaseSchema, updateCaseSchema, listQuerySchema, idParamSchema, caseIdParamSchema };
