import BaseAgent from './baseAgent.js';

/**
 * Lightweight heuristic translator: not a real NLP model, but deterministic
 * enough to demonstrate another agent class plugged into the network.
 * Mocks EN <-> FR by swapping a small dictionary.
 */
const EN_FR = {
  the: 'le', and: 'et', is: 'est', of: 'de', to: 'à', a: 'un',
  in: 'dans', it: 'il', for: 'pour', with: 'avec', hello: 'bonjour',
  world: 'monde', agent: 'agent', task: 'tâche', network: 'réseau',
  payment: 'paiement', client: 'client', worker: 'travailleur'
};

class TranslatorAgent extends BaseAgent {
  constructor(walletId = 'translator_wallet', variant = 'default') {
    super(`Translator-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['translate'];
  }

  async execute(input) {
    const text = typeof input.text === 'string' ? input.text : '';
    const target = (input.targetLang || 'fr').toLowerCase();

    const translated = text
      .split(/\s+/)
      .map((word) => {
        const key = word.toLowerCase().replace(/[^a-z]/g, '');
        if (target === 'fr' && EN_FR[key]) return EN_FR[key];
        return word;
      })
      .join(' ');

    return {
      success: true,
      result: translated.trim() || text,
      agent: this.name,
      walletId: this.walletId
    };
  }
}

export default TranslatorAgent;
