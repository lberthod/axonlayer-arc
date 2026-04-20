import { describe, it, expect } from 'vitest';
import agentRegistry from '../src/core/agentRegistry.js';

describe('agentRegistry', () => {
  it('seeds default workers and validators', () => {
    const w = agentRegistry.listWorkers();
    const v = agentRegistry.listValidators();
    expect(w.length).toBeGreaterThanOrEqual(3);
    expect(v.length).toBeGreaterThanOrEqual(2);
    for (const e of [...w, ...v]) {
      expect(e.basePrice).toBeGreaterThan(0);
      expect(e.score).toBeGreaterThan(0);
    }
  });

  it('selects cheapest capable worker with strategy=price', () => {
    const pick = agentRegistry.selectWorker('summarize', 'price');
    const all = agentRegistry
      .listWorkers()
      .filter((w) => w.taskTypes.includes('summarize') || w.taskTypes.includes('*'));
    const minPrice = Math.min(...all.map((w) => w.basePrice));
    expect(pick.basePrice).toBe(minPrice);
  });

  it('selects highest-score worker with strategy=score', () => {
    const pick = agentRegistry.selectWorker('summarize', 'score');
    const all = agentRegistry
      .listWorkers()
      .filter((w) => w.taskTypes.includes('summarize') || w.taskTypes.includes('*'));
    const maxScore = Math.max(...all.map((w) => w.score));
    expect(pick.score).toBe(maxScore);
  });

  it('returns null for a task type no worker can handle', () => {
    expect(agentRegistry.selectWorker('nonexistent-type', 'price')).toBeNull();
  });

  it('records outcomes and updates EMA score', () => {
    const before = agentRegistry.listWorkers().find((w) => w.id === 'worker_default');
    agentRegistry.recordOutcome('worker', 'worker_default', { success: true, scoreFeedback: 0.5 });
    const after = agentRegistry.listWorkers().find((w) => w.id === 'worker_default');
    expect(after.completed).toBe(before.completed + 1);
    expect(after.score).not.toBe(before.score);
  });
});
