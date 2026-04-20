import BaseAgent from './baseAgent.js';
import { config } from '../config.js';
import llmClient from '../core/llmClient.js';

const LLM_PROMPTS = {
  summarize: 'Summarize the following text in 1-2 concise sentences. Return only the summary.',
  keywords: 'Extract up to 5 comma-separated keywords from the following text. Return only the keywords.',
  rewrite: 'Rewrite the following text in clearer, more polished English. Return only the rewritten version.'
};

class WorkerAgent extends BaseAgent {
  constructor(walletId = config.wallets.worker, variant = 'default') {
    super(`Worker-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['summarize', 'keywords', 'rewrite'];
  }

  async execute(input) {
    const taskType = input.taskType || 'summarize';
    const text = typeof input.text === 'string' ? input.text.trim() : '';

    let result;
    let backend = 'local';

    if (llmClient.isEnabled() && LLM_PROMPTS[taskType]) {
      try {
        result = await llmClient.respond({
          instructions: LLM_PROMPTS[taskType],
          input: text
        });
        backend = `llm:${config.llm.model}`;
      } catch (error) {
        console.warn(`[${this.name}] LLM failed, falling back to local:`, error.message);
      }
    }

    if (!result) {
      switch (taskType) {
        case 'summarize':
          result = this.summarize(text);
          break;
        case 'keywords':
          result = this.extractKeywords(text);
          break;
        case 'rewrite':
          result = this.rewrite(text);
          break;
        default:
          result = this.summarize(text);
      }
    }

    return {
      success: true,
      result,
      agent: this.name,
      walletId: this.walletId,
      backend
    };
  }

  summarize(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

    if (sentences.length >= 2) {
      return sentences.slice(0, 2).join(' ');
    }

    const words = cleaned.split(' ').filter(Boolean);
    const summaryLength = Math.min(words.length, 40);
    const summary = words.slice(0, summaryLength).join(' ');

    return summary + (words.length > summaryLength ? '...' : '');
  }

  extractKeywords(text) {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 5).join(', ');
  }

  rewrite(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';

    return `Rewritten version: ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  }
}

export default WorkerAgent;
