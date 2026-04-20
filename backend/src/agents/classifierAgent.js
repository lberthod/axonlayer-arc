import BaseAgent from './baseAgent.js';

/**
 * ClassifierAgent: assigns a simple topic label by counting keyword hits.
 */
const TOPICS = {
  technology: ['ai', 'software', 'computer', 'blockchain', 'data', 'cloud', 'quantum', 'machine', 'algorithm'],
  finance: ['usdc', 'payment', 'revenue', 'margin', 'bank', 'transaction', 'currency', 'price', 'cost'],
  environment: ['climate', 'energy', 'renewable', 'carbon', 'green', 'sustainable', 'pollution'],
  health: ['medicine', 'health', 'biotech', 'medical', 'hospital', 'patient'],
  general: []
};

class ClassifierAgent extends BaseAgent {
  constructor(walletId = 'classifier_wallet', variant = 'default') {
    super(`Classifier-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['classify'];
  }

  async execute(input) {
    const text = (typeof input.text === 'string' ? input.text : '').toLowerCase();

    const scores = Object.fromEntries(
      Object.entries(TOPICS).map(([topic, keywords]) => [
        topic,
        keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0)
      ])
    );

    const [topic, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const label = score > 0 ? topic : 'general';

    return {
      success: true,
      result: `topic: ${label}`,
      agent: this.name,
      walletId: this.walletId,
      metadata: { scores }
    };
  }
}

export default ClassifierAgent;
