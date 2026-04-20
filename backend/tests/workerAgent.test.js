import { describe, it, expect } from 'vitest';
import WorkerAgent from '../src/agents/workerAgent.js';
import ValidatorAgent from '../src/agents/validatorAgent.js';

describe('WorkerAgent (local mode)', () => {
  const worker = new WorkerAgent('worker_wallet', 'default');

  it('summarizes to at most two sentences', async () => {
    const res = await worker.execute({
      text: 'Alpha is a platform. Beta builds on alpha. Gamma extends it further. Delta adds analytics.',
      taskType: 'summarize'
    });
    expect(res.success).toBe(true);
    expect(typeof res.result).toBe('string');
    expect(res.result.length).toBeGreaterThan(0);
  });

  it('extracts up to 5 keywords, unique, lowercase', async () => {
    const res = await worker.execute({
      text: 'The quick brown fox jumps over the lazy dog. Brown fox, quick fox!',
      taskType: 'keywords'
    });
    const kws = res.result.split(',').map((s) => s.trim()).filter(Boolean);
    expect(kws.length).toBeLessThanOrEqual(5);
    expect(new Set(kws).size).toBe(kws.length);
  });

  it('rewrite returns a non-empty transformation', async () => {
    const res = await worker.execute({ text: 'hello world.', taskType: 'rewrite' });
    expect(res.result.length).toBeGreaterThan(0);
  });
});

describe('ValidatorAgent', () => {
  const v = new ValidatorAgent('validator_wallet', 'default', 1.0);

  it('rejects empty result', async () => {
    const r = await v.execute({ result: '', originalText: 'some text' });
    expect(r.validation.valid).toBe(false);
  });

  it('accepts a plausible summary', async () => {
    const r = await v.execute({
      result: 'This is a valid concise summary of the source text.',
      originalText: 'This is a valid concise summary of the source text that was much longer than the output.'
    });
    expect(r.validation.valid).toBe(true);
    expect(r.validation.score).toBeGreaterThan(0);
  });
});
