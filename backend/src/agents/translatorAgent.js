import BaseAgent from './baseAgent.js';
import llmClient from '../core/llmClient.js';

/**
 * TranslatorAgent optimisé avec GPT-5-nano
 * Support de traductions multilingues de qualité professionnelle
 */
const TRANSLATION_PROMPTS = {
  fr: 'Translate the provided text to French. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  es: 'Translate the provided text to Spanish. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  de: 'Translate the provided text to German. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  it: 'Translate the provided text to Italian. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  pt: 'Translate the provided text to Portuguese. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  ja: 'Translate the provided text to Japanese. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  zh: 'Translate the provided text to Chinese (Simplified). Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  ko: 'Translate the provided text to Korean. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  ru: 'Translate the provided text to Russian. Maintain the original tone and meaning exactly. Return ONLY the translated text.',
  ar: 'Translate the provided text to Arabic. Maintain the original tone and meaning exactly. Return ONLY the translated text.'
};

// Simple dictionary for fallback
const BASIC_DICTIONARIES = {
  fr: { the: 'le', and: 'et', is: 'est', of: 'de', to: 'à', a: 'un', hello: 'bonjour', world: 'monde' },
  es: { the: 'el', and: 'y', is: 'es', of: 'de', to: 'a', a: 'un', hello: 'hola', world: 'mundo' },
  de: { the: 'der', and: 'und', is: 'ist', of: 'von', to: 'zu', a: 'ein', hello: 'hallo', world: 'welt' }
};

class TranslatorAgent extends BaseAgent {
  constructor(walletId = 'translator_wallet', variant = 'default') {
    super(`Translator-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['translate'];
    this.llmAttempts = 0;
    this.llmSuccesses = 0;
  }

  async execute(input) {
    const text = typeof input.text === 'string' ? input.text.trim() : '';
    const targetLang = (input.targetLang || 'fr').toLowerCase().slice(0, 2);

    if (!text) {
      throw new Error('Text required for translation');
    }

    let result;
    let backend = 'local';

    // Try LLM first for quality
    if (llmClient.isEnabled()) {
      try {
        result = await this.translateWithLlm(text, targetLang);
        backend = 'llm:gpt-5-nano';
        this.llmSuccesses++;
      } catch (error) {
        console.warn(`[${this.name}] LLM translation failed:`, error.message);
      }
      this.llmAttempts++;
    }

    // Fallback to dictionary-based translation
    if (!result) {
      result = this.translateLocal(text, targetLang);
      backend = `local:${targetLang}`;
    }

    return {
      success: true,
      result,
      agent: this.name,
      walletId: this.walletId,
      backend,
      targetLanguage: targetLang,
      llmStats: {
        attempts: this.llmAttempts,
        successes: this.llmSuccesses,
        successRate: this.llmAttempts > 0 ? (this.llmSuccesses / this.llmAttempts).toFixed(2) : 'N/A'
      }
    };
  }

  /**
   * Professional translation using OpenAI GPT-5-nano
   */
  async translateWithLlm(text, targetLang) {
    const prompt = TRANSLATION_PROMPTS[targetLang];
    if (!prompt) {
      throw new Error(`Unsupported language: ${targetLang}`);
    }

    const result = await llmClient.respond({
      instructions: prompt,
      input: text,
      maxOutputTokens: Math.min(1000, Math.ceil(text.length * 1.2)),
      reasoningEffort: 'low'
    });

    if (!result || result.trim().length === 0) {
      throw new Error('LLM returned empty translation');
    }

    return result.trim();
  }

  /**
   * Local dictionary-based fallback
   */
  translateLocal(text, targetLang) {
    const dictionary = BASIC_DICTIONARIES[targetLang] || {};

    const translated = text
      .split(/\s+/)
      .map(word => {
        const key = word.toLowerCase().replace(/[^a-z]/g, '');
        if (dictionary[key]) {
          // Preserve case
          if (word[0] === word[0].toUpperCase()) {
            return dictionary[key].charAt(0).toUpperCase() + dictionary[key].slice(1);
          }
          return dictionary[key];
        }
        return word;
      })
      .join(' ');

    // Note: Limited dictionary translation
    return translated + (dictionary !== BASIC_DICTIONARIES[targetLang] ? ' [local dictionary translation]' : '');
  }
}

export default TranslatorAgent;
