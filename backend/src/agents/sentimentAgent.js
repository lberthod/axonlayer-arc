import BaseAgent from './baseAgent.js';

const POS = ['good', 'great', 'excellent', 'love', 'positive', 'amazing', 'benefit', 'success', 'progress', 'efficient'];
const NEG = ['bad', 'terrible', 'hate', 'negative', 'awful', 'fail', 'failure', 'risk', 'problem', 'threat'];

class SentimentAgent extends BaseAgent {
  constructor(walletId = 'sentiment_wallet', variant = 'default') {
    super(`Sentiment-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['sentiment'];
  }

  async execute(input) {
    const words = (typeof input.text === 'string' ? input.text : '').toLowerCase().split(/\W+/);
    const pos = words.filter((w) => POS.includes(w)).length;
    const neg = words.filter((w) => NEG.includes(w)).length;

    let label = 'neutral';
    if (pos > neg) label = 'positive';
    else if (neg > pos) label = 'negative';

    const score = words.length === 0 ? 0 : (pos - neg) / Math.max(1, words.length);

    return {
      success: true,
      result: `sentiment: ${label} (${score.toFixed(3)})`,
      agent: this.name,
      walletId: this.walletId,
      metadata: { positive: pos, negative: neg }
    };
  }
}

export default SentimentAgent;
