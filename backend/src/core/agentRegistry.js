import { config } from '../config.js';
import WorkerAgent from '../agents/workerAgent.js';
import ValidatorAgent from '../agents/validatorAgent.js';
import TranslatorAgent from '../agents/translatorAgent.js';
import ClassifierAgent from '../agents/classifierAgent.js';
import SentimentAgent from '../agents/sentimentAgent.js';
import providerStore from './providerStore.js';

/**
 * AgentRegistry maintains the pool of worker and validator instances the
 * orchestrator can dispatch to. Each entry exposes a `basePrice` (quote) and
 * a `score` (running quality average) so selection can be driven by either
 * price, score, or a weighted combination.
 *
 * The registry stays in-memory; on a fresh boot, default agents are seeded
 * with reasonable defaults. Scores are updated after every executed task.
 */
class AgentRegistry {
  constructor() {
    this.workers = [];
    this.validators = [];
    this.seeded = false;
  }

  seedDefaults() {
    if (this.seeded) return;
    this.seeded = true;

    const worker = new WorkerAgent('worker_wallet', 'default');
    const workerFast = new WorkerAgent('worker_fast_wallet', 'fast');
    workerFast.taskTypes = ['summarize', 'keywords'];
    const workerPremium = new WorkerAgent('worker_premium_wallet', 'premium');

    const translator = new TranslatorAgent('translator_wallet', 'default');
    const classifier = new ClassifierAgent('classifier_wallet', 'default');
    const sentiment = new SentimentAgent('sentiment_wallet', 'default');

    this.workers = [
      {
        id: 'worker_default',
        agent: worker,
        taskTypes: worker.taskTypes,
        basePrice: 0.002,
        score: config.registry.defaultScore,
        completed: 0,
        failed: 0,
        ownerId: 'dev_001',
        ownerName: 'Alice'
      },
      {
        id: 'worker_fast',
        agent: workerFast,
        taskTypes: workerFast.taskTypes,
        basePrice: 0.0015,
        score: 0.65,
        completed: 0,
        failed: 0,
        ownerId: 'dev_002',
        ownerName: 'Bob'
      },
      {
        id: 'worker_premium',
        agent: workerPremium,
        taskTypes: workerPremium.taskTypes,
        basePrice: 0.0035,
        score: 0.92,
        completed: 0,
        failed: 0,
        ownerId: 'dev_003',
        ownerName: 'Charlie'
      },
      {
        id: 'translator_default',
        agent: translator,
        taskTypes: translator.taskTypes,
        basePrice: 0.003,
        score: 0.78,
        completed: 0,
        failed: 0,
        ownerId: 'dev_004',
        ownerName: 'Diana'
      },
      {
        id: 'classifier_default',
        agent: classifier,
        taskTypes: classifier.taskTypes,
        basePrice: 0.0018,
        score: 0.8,
        completed: 0,
        failed: 0,
        ownerId: 'dev_005',
        ownerName: 'Eve'
      },
      {
        id: 'sentiment_default',
        agent: sentiment,
        taskTypes: sentiment.taskTypes,
        basePrice: 0.0014,
        score: 0.82,
        completed: 0,
        failed: 0,
        ownerId: 'dev_006',
        ownerName: 'Frank'
      }
    ];

    const validator = new ValidatorAgent('validator_wallet', 'default', 1.0);
    const validatorStrict = new ValidatorAgent('validator_strict_wallet', 'strict', 1.6);

    this.validators = [
      {
        id: 'validator_default',
        agent: validator,
        basePrice: 0.001,
        score: config.registry.defaultScore,
        completed: 0,
        failed: 0,
        ownerId: 'dev_007',
        ownerName: 'Grace'
      },
      {
        id: 'validator_strict',
        agent: validatorStrict,
        basePrice: 0.0015,
        score: 0.9,
        completed: 0,
        failed: 0,
        ownerId: 'dev_008',
        ownerName: 'Henry'
      }
    ];
  }

  listWorkers() {
    this.seedDefaults();
    return this.workers.map((w) => this.#publicEntry(w));
  }

  listValidators() {
    this.seedDefaults();
    return this.validators.map((w) => this.#publicEntry(w));
  }

  /**
   * Selection strategies:
   *  - `price`       : cheapest capable worker
   *  - `score`       : highest historical score
   *  - `score_price` : weighted combination (default)
   *
   * taskType filters capable workers; validators are always capable.
   * Special handling: translate tasks always use TranslatorAgent for quality.
   */
  selectWorker(taskType, strategy = config.registry.selectionStrategy) {
    this.seedDefaults();

    // Force translate tasks to use specialized TranslatorAgent
    if (taskType === 'translate') {
      const translator = this.workers.find((w) => w.id === 'translator_default');
      if (translator) return translator;
    }

    const capable = this.workers.filter((w) =>
      w.taskTypes.includes(taskType) || w.taskTypes.includes('*')
    );

    if (capable.length === 0) return null;

    return this.#pick(capable, strategy);
  }

  selectValidator(strategy = config.registry.selectionStrategy) {
    this.seedDefaults();
    if (this.validators.length === 0) return null;
    return this.#pick(this.validators, strategy);
  }

  recordOutcome(kind, id, { success, scoreFeedback } = {}) {
    const pool = kind === 'worker' ? this.workers : this.validators;
    const entry = pool.find((p) => p.id === id);
    if (!entry) return;

    if (success) entry.completed += 1;
    else entry.failed += 1;

    if (typeof scoreFeedback === 'number') {
      // Exponential moving average with alpha=0.2
      entry.score = Number((entry.score * 0.8 + scoreFeedback * 0.2).toFixed(4));
    }
  }

  #pick(entries, strategy) {
    if (strategy === 'price') {
      return entries.slice().sort((a, b) => a.basePrice - b.basePrice)[0];
    }

    if (strategy === 'score') {
      return entries.slice().sort((a, b) => b.score - a.score)[0];
    }

    // score_price weighted combination
    const prices = entries.map((e) => e.basePrice);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const sw = config.registry.scoreWeight;
    const pw = config.registry.priceWeight;

    return entries
      .slice()
      .sort((a, b) => {
        const priceA = 1 - (a.basePrice - minP) / range;
        const priceB = 1 - (b.basePrice - minP) / range;
        const rankA = sw * a.score + pw * priceA;
        const rankB = sw * b.score + pw * priceB;
        return rankB - rankA;
      })[0];
  }

  async hydrateFromProviders() {
    this.seedDefaults();
    await providerStore.load();
    const approved = providerStore.list({ status: 'approved' });

    // Drop previous marketplace entries before rebuilding
    this.workers = this.workers.filter((w) => !w.providerId);
    this.validators = this.validators.filter((v) => !v.providerId);

    for (const p of approved) {
      const walletId = p.walletAddress || `provwallet_${p.id}`;
      if (p.role === 'worker') {
        const agent = new WorkerAgent(walletId, `mkt-${p.id.slice(-4)}`);
        if (p.taskTypes?.length) agent.taskTypes = p.taskTypes;
        this.workers.push({
          id: `mkt_${p.id}`,
          providerId: p.id,
          agent,
          taskTypes: agent.taskTypes,
          basePrice: p.basePrice,
          score: p.score,
          completed: p.stats?.completed || 0,
          failed: p.stats?.failed || 0
        });
      } else if (p.role === 'validator') {
        const agent = new ValidatorAgent(walletId, `mkt-${p.id.slice(-4)}`, 1.0);
        this.validators.push({
          id: `mkt_${p.id}`,
          providerId: p.id,
          agent,
          basePrice: p.basePrice,
          score: p.score,
          completed: p.stats?.completed || 0,
          failed: p.stats?.failed || 0
        });
      }
    }
  }

  #publicEntry(entry) {
    return {
      id: entry.id,
      providerId: entry.providerId || null,
      name: entry.agent.name,
      walletId: entry.agent.walletId,
      taskTypes: entry.taskTypes || ['*'],
      basePrice: entry.basePrice,
      score: entry.score,
      completed: entry.completed,
      failed: entry.failed
    };
  }
}

export default new AgentRegistry();
