import BaseAgent from './baseAgent.js';
import llmClient from '../core/llmClient.js';

/**
 * TranslatorAgent optimisé avec GPT-5-nano
 * Support de traductions multilingues de qualité professionnelle
 */
const TRANSLATION_PROMPTS = {
  fr: `You are a professional translator specializing in French. Translate the provided text to French with these principles:
- Preserve exact meaning and intent (not literal word-for-word)
- Match the original tone (formal, casual, technical, creative)
- Use natural, idiomatic French (not awkward literal translation)
- Keep technical terms accurate (USDC → USDC, blockchain → blockchain)
- Maintain formatting, line breaks, structure
Return ONLY the translated text, nothing else.`,

  es: `You are a professional translator specializing in Spanish. Translate to Spanish with these principles:
- Preserve exact meaning and intent
- Match the original tone and register
- Use natural, idiomatic Spanish
- Keep technical terms accurate
- Maintain original formatting
Return ONLY the translated text, nothing else.`,

  de: `You are a professional translator specializing in German. Translate to German with these principles:
- Preserve exact meaning and intent
- Match the original tone and register
- Use natural, idiomatic German
- Keep technical terms accurate
- Maintain original formatting
Return ONLY the translated text, nothing else.`,

  it: `Traduci il testo fornito all'italiano mantenendo il significato esatto, il tono originale, e lo stile naturale. Usa termini tecnici accurati. Restituisci SOLO il testo tradotto.`,

  pt: `Você é um tradutor profissional especializado em português. Traduza para português brasileiro mantendo significado exato, tom original, e linguagem natural. Retorne APENAS o texto traduzido.`,

  ja: `あなたは日本語の専門翻訳者です。元の意味、トーン、スタイルを保つ自然な日本語に翻訳してください。翻訳されたテキストのみを返してください。`,

  zh: `你是一位专业翻译者。将文本翻译为简体中文，保留原意、语气和风格。返回仅翻译后的文本。`,

  ko: `당신은 전문 번역가입니다. 원래 의미, 톤, 스타일을 유지하면서 한국어로 번역하세요. 번역된 텍스트만 반환하세요.`,

  ru: `Вы профессиональный переводчик. Переведите текст на русский язык, сохраняя исходное значение, тон и стиль. Верните только переведенный текст.`,

  ar: `أنت مترجم متخصص. ترجم النص إلى العربية مع الحفاظ على المعنى والنبرة والأسلوب الأصلي. أرجع النص المترجم فقط.`
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
        console.log(`[${this.name}:execute] Trying LLM backend (model: gpt-5-nano-2025-08-07) for ${targetLang}...`);
        result = await this.translateWithLlm(text, targetLang);
        backend = 'llm:gpt-5-nano';
        this.llmSuccesses++;
        console.log(`[${this.name}:execute] ✓ LLM succeeded via gpt-5-nano-2025-08-07: translated to ${targetLang} (length: ${result.length})`);
      } catch (error) {
        console.warn(`[${this.name}:execute] LLM failed: ${error.message}`);
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
