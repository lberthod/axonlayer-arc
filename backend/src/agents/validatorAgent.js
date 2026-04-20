import BaseAgent from './baseAgent.js';
import { config } from '../config.js';

class ValidatorAgent extends BaseAgent {
  constructor(walletId = config.wallets.validator, variant = 'default', strictness = 1.0) {
    super(`Validator-${variant}`, walletId);
    this.variant = variant;
    this.strictness = strictness;
    this.taskTypes = ['*'];
  }

  async execute(input) {
    const result = input.result;
    const originalText = input.originalText;

    const validation = this.validate(result, originalText);

    return {
      success: true,
      validation,
      agent: this.name,
      walletId: this.walletId
    };
  }

  validate(result, originalText) {
    const resultText = typeof result === 'string' ? result.trim() : '';
    const sourceText = typeof originalText === 'string' ? originalText.trim() : '';

    const resultWords = resultText ? resultText.split(/\s+/) : [];
    const sourceWords = sourceText ? sourceText.split(/\s+/) : [];

    const checks = {
      notEmpty: resultText.length > 0,
      reasonableLength: resultText.length > 10 && resultText.length < 500,
      hasContent: resultWords.length >= 3,
      shorterThanSource: sourceWords.length === 0 ? true : resultWords.length <= sourceWords.length
    };

    const score = this.calculateScore(checks);
    const threshold = Math.min(0.95, config.validation.minScore * this.strictness);
    const isValid = score >= threshold;

    return {
      valid: isValid,
      score,
      checks,
      notes: this.generateNotes(checks, isValid)
    };
  }

  calculateScore(checks) {
    let score = 0;
    if (checks.notEmpty) score += 0.3;
    if (checks.reasonableLength) score += 0.25;
    if (checks.hasContent) score += 0.25;
    if (checks.shorterThanSource) score += 0.2;
    return score;
  }

  generateNotes(checks, isValid) {
    if (isValid) {
      return 'Validation passed: result meets quality standards';
    }

    const issues = [];
    if (!checks.notEmpty) issues.push('result is empty');
    if (!checks.reasonableLength) issues.push('result length is invalid');
    if (!checks.hasContent) issues.push('result lacks sufficient content');
    if (!checks.shorterThanSource) issues.push('result should not be longer than source');

    return `Validation failed: ${issues.join(', ')}`;
  }
}

export default ValidatorAgent;
