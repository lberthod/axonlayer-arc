import BaseAgent from './baseAgent.js';
import { config } from '../config.js';
import llmClient from '../core/llmClient.js';

/**
 * ValidatorAgent optimisé avec LLM
 * Utilise GPT-5-nano pour validation sémantique intelligente
 */
const VALIDATION_PROMPTS = {
  general: `You are an expert quality validator. Evaluate the following processed result based on these criteria:
1. Accuracy: Does the result accurately represent the input?
2. Completeness: Does it capture all important information?
3. Clarity: Is it clear, well-written, and easy to understand?
4. Relevance: Is all content relevant and focused?

Input: {input}
Result: {result}

Provide a single assessment: "PASS" if the result meets quality standards, "FAIL" if it doesn't. Return ONLY "PASS" or "FAIL" followed by a brief score 0-100.`,

  summarize: `Validate this text summary. Check if:
1. It captures the main points of the original text
2. It's concise yet complete
3. There are no factual errors
4. It's well-written and clear

Original: {input}
Summary: {result}

Return ONLY "PASS" or "FAIL" with a score 0-100.`,

  rewrite: `Validate this rewritten text. Check if:
1. All original meaning is preserved
2. The language is improved and clearer
3. There are no grammatical errors
4. It's more engaging than the original

Original: {input}
Rewritten: {result}

Return ONLY "PASS" or "FAIL" with a score 0-100.`,

  keywords: `Validate these extracted keywords. Check if:
1. They represent the main topics of the text
2. They are relevant and important
3. No irrelevant keywords are included

Text: {input}
Keywords: {result}

Return ONLY "PASS" or "FAIL" with a score 0-100.`
};

class ValidatorAgent extends BaseAgent {
  constructor(walletId = config.wallets.validator, variant = 'default', strictness = 1.0) {
    super(`Validator-${variant}`, walletId);
    this.variant = variant;
    this.strictness = strictness;
    this.taskTypes = ['*'];
    this.llmValidations = 0;
    this.llmSuccesses = 0;
  }

  /**
   * Execute validation with LLM-first strategy
   */
  async execute(input) {
    const result = input.result;
    const originalText = input.originalText;
    const taskType = input.taskType || 'summarize';

    let validation;
    let usedLlm = false;

    // Try LLM validation first
    if (llmClient.isEnabled()) {
      try {
        validation = await this.validateWithLlm(result, originalText, taskType);
        usedLlm = true;
        this.llmSuccesses++;
      } catch (error) {
        console.warn(`[${this.name}] LLM validation failed:`, error.message);
      }
      this.llmValidations++;
    }

    // Fallback to local validation if LLM fails
    if (!validation) {
      validation = this.validateLocal(result, originalText);
      usedLlm = false;
    }

    return {
      success: true,
      validation: {
        ...validation,
        usedLlm,
        llmStats: {
          attempts: this.llmValidations,
          successes: this.llmSuccesses,
          successRate: this.llmValidations > 0 ? (this.llmSuccesses / this.llmValidations).toFixed(2) : 'N/A'
        }
      },
      agent: this.name,
      walletId: this.walletId
    };
  }

  /**
   * Validate using GPT-5-nano for semantic understanding
   */
  async validateWithLlm(result, originalText, taskType) {
    let prompt = VALIDATION_PROMPTS[taskType] || VALIDATION_PROMPTS.general;

    prompt = prompt
      .replace('{input}', originalText || 'N/A')
      .replace('{result}', result || 'N/A');

    const response = await llmClient.respond({
      instructions: prompt,
      input: originalText || '',
      maxOutputTokens: 100,
      reasoningEffort: 'low'
    });

    return this.parseLlmValidation(response, originalText, result);
  }

  /**
   * Parse LLM validation response
   */
  parseLlmValidation(response, originalText, result) {
    const trimmed = response.trim().toUpperCase();
    let score = 0.5;
    let valid = false;

    // Parse response format: "PASS/FAIL score"
    if (trimmed.includes('PASS')) {
      valid = true;
      const match = trimmed.match(/(\d+)/);
      score = match ? Math.min(100, parseInt(match[1], 10)) / 100 : 0.85;
    } else if (trimmed.includes('FAIL')) {
      valid = false;
      const match = trimmed.match(/(\d+)/);
      score = match ? Math.min(100, parseInt(match[1], 10)) / 100 : 0.35;
    }

    const threshold = Math.min(0.95, config.validation.minScore * this.strictness);
    valid = score >= threshold;

    return {
      valid,
      score: Math.min(1.0, score),
      checks: {
        notEmpty: Boolean(result && result.trim().length > 0),
        semanticallyValid: score > 0.6,
        llmApproved: valid,
        reasonableLengthDelta: originalText && result ? this.checkLengthDelta(originalText, result) : true
      },
      notes: valid
        ? `LLM validation passed: score ${(score * 100).toFixed(0)}/100`
        : `LLM validation failed: score ${(score * 100).toFixed(0)}/100. Result does not meet quality standards.`
    };
  }

  /**
   * Local validation (fallback)
   */
  validateLocal(result, originalText) {
    const resultText = typeof result === 'string' ? result.trim() : '';
    const sourceText = typeof originalText === 'string' ? originalText.trim() : '';

    const resultWords = resultText ? resultText.split(/\s+/) : [];
    const sourceWords = sourceText ? sourceText.split(/\s+/) : [];

    const checks = {
      notEmpty: resultText.length > 0,
      reasonableLength: resultText.length > 10 && resultText.length < 500,
      hasContent: resultWords.length >= 3,
      shorterThanSource: sourceWords.length === 0 ? true : resultWords.length <= sourceWords.length,
      reasonableLengthDelta: this.checkLengthDelta(sourceText, resultText),
      noRepetition: this.checkNoRepetition(resultText)
    };

    const score = this.calculateScoreLocal(checks);
    const threshold = Math.min(0.95, config.validation.minScore * this.strictness);
    const isValid = score >= threshold;

    return {
      valid: isValid,
      score,
      checks,
      notes: this.generateNotesLocal(checks, isValid)
    };
  }

  /**
   * Calculate local validation score
   */
  calculateScoreLocal(checks) {
    let score = 0;
    if (checks.notEmpty) score += 0.25;
    if (checks.reasonableLength) score += 0.20;
    if (checks.hasContent) score += 0.20;
    if (checks.shorterThanSource) score += 0.15;
    if (checks.reasonableLengthDelta) score += 0.10;
    if (checks.noRepetition) score += 0.10;
    return score;
  }

  /**
   * Check if result length is reasonable relative to source
   */
  checkLengthDelta(sourceText, resultText) {
    if (!sourceText) return true;

    const sourceLen = sourceText.length;
    const resultLen = resultText.length;

    // Result should be 20-80% of source length (for summarization)
    return resultLen >= sourceLen * 0.15 && resultLen <= sourceLen * 0.95;
  }

  /**
   * Check for excessive repetition
   */
  checkNoRepetition(text) {
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = {};
    let maxRepeat = 0;

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
      maxRepeat = Math.max(maxRepeat, wordCounts[word]);
    });

    // Fail if any word repeats more than 30% of total words
    return maxRepeat < words.length * 0.3;
  }

  /**
   * Generate human-readable validation notes
   */
  generateNotesLocal(checks, isValid) {
    if (isValid) {
      return 'Validation passed: result meets quality standards';
    }

    const issues = [];
    if (!checks.notEmpty) issues.push('result is empty');
    if (!checks.reasonableLength) issues.push('result length is invalid');
    if (!checks.hasContent) issues.push('result lacks sufficient content');
    if (!checks.shorterThanSource) issues.push('result is longer than source');
    if (!checks.reasonableLengthDelta) issues.push('result length delta is unreasonable');
    if (!checks.noRepetition) issues.push('result has excessive word repetition');

    return `Validation failed: ${issues.join(', ')}`;
  }
}

export default ValidatorAgent;
