import { z } from 'zod';

export const taskTypeSchema = z.enum([
  'summarize',
  'keywords',
  'rewrite',
  'translate',
  'classify',
  'sentiment'
]);

export const selectionStrategySchema = z.enum(['price', 'score', 'score_price']);

export const createTaskSchema = z.object({
  input: z
    .string({ required_error: 'input is required' })
    .trim()
    .min(20, 'input must be at least 20 characters (you provided empty or too short text)')
    .max(5000, 'input is too long (max 5000 chars)'),
  taskType: taskTypeSchema.default('summarize'),
  selectionStrategy: selectionStrategySchema.optional(),
  targetLang: z.string().max(10).optional()
}).refine(
  (data) => {
    // Additional validation per task type
    if (data.taskType === 'summarize' && data.input.length < 50) {
      return false;
    }
    if (data.taskType === 'translate' && data.input.length < 10) {
      return false;
    }
    return true;
  },
  {
    message: 'Input is too short for this task type',
    path: ['input']
  }
);

export const simulateSchema = z.object({
  count: z.number().int().min(1).max(500).default(50),
  taskType: taskTypeSchema.optional(),
  selectionStrategy: selectionStrategySchema.optional()
});

/**
 * Express middleware: parses req.body through the given zod schema.
 * On success mutates req.body with the parsed (typed) value; on failure
 * forwards a ZodError which the global error handler converts to a 400.
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (err) {
      next(err);
    }
  };
}
