import BaseAgent from './baseAgent.js';
import llmClient from '../core/llmClient.js';

/**
 * ClassifierAgent optimisé avec GPT-5-nano
 * Classification intelligente multilingue de textes
 */
const LLM_PROMPT = `You are an expert text classifier with deep domain knowledge.

Analyze the provided text and classify it into the MOST APPROPRIATE category from:
- technology: AI, software, blockchain, data science, cloud computing
- finance: payments, USDC, markets, investments, banking
- business: companies, startups, commerce, enterprise, sales
- health: medicine, biotech, wellness, healthcare
- science: research, physics, chemistry, biology, discovery
- entertainment: movies, music, arts, celebrities, culture
- sports: athletics, games, teams, competitions, championship
- education: learning, schools, courses, academics, training
- environment: climate, renewable energy, sustainability, ecology
- politics: government, elections, legislation, policy
- other: doesn't fit above categories

Consider:
- Primary subject matter
- Language and terminology used
- Context and industry focus
- Implicit signals (not just explicit keywords)

Return ONLY the category name in lowercase, nothing else.`;

const TOPICS = {
  technology: ['ai', 'software', 'computer', 'blockchain', 'data', 'cloud', 'quantum', 'machine', 'algorithm', 'app', 'code', 'digital'],
  finance: ['usdc', 'payment', 'revenue', 'margin', 'bank', 'transaction', 'currency', 'price', 'cost', 'money', 'investment', 'trade'],
  business: ['business', 'company', 'market', 'sales', 'profit', 'enterprise', 'corporation', 'commerce', 'industry', 'startup'],
  environment: ['climate', 'energy', 'renewable', 'carbon', 'green', 'sustainable', 'pollution', 'ecology', 'nature', 'environmental'],
  health: ['medicine', 'health', 'biotech', 'medical', 'hospital', 'patient', 'doctor', 'disease', 'cure', 'wellness', 'therapy'],
  science: ['research', 'study', 'experiment', 'scientific', 'physics', 'chemistry', 'biology', 'theory', 'hypothesis', 'discovery'],
  entertainment: ['movie', 'music', 'film', 'actor', 'entertainment', 'show', 'entertainment', 'celebrity', 'comedy', 'drama'],
  sports: ['sport', 'game', 'team', 'player', 'match', 'tournament', 'athletic', 'championship', 'football', 'basketball'],
  education: ['education', 'school', 'university', 'student', 'learning', 'teacher', 'course', 'academic', 'study', 'training'],
  politics: ['political', 'government', 'vote', 'election', 'parliament', 'politician', 'law', 'legislation', 'policy', 'senate'],
  general: []
};

class ClassifierAgent extends BaseAgent {
  constructor(walletId = 'classifier_wallet', variant = 'default') {
    super(`Classifier-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['classify'];
    this.llmAttempts = 0;
    this.llmSuccesses = 0;
  }

  async execute(input) {
    const text = typeof input.text === 'string' ? input.text.trim() : '';

    if (!text) {
      throw new Error('Text required for classification');
    }

    let classification;
    let backend = 'local';
    let confidence = 0;

    // Try LLM first for quality
    if (llmClient.isEnabled()) {
      try {
        console.log(`[${this.name}:execute] Trying LLM backend (model: gpt-5-nano-2025-08-07)...`);
        classification = await this.classifyWithLlm(text);
        backend = 'llm:gpt-5-nano';
        confidence = 0.95;
        this.llmSuccesses++;
        console.log(`[${this.name}:execute] ✓ LLM succeeded via gpt-5-nano-2025-08-07: ${classification}`);
      } catch (error) {
        console.warn(`[${this.name}:execute] LLM failed: ${error.message}`);
      }
      this.llmAttempts++;
    }

    // Fallback to keyword-based classification
    if (!classification) {
      const result = this.classifyLocal(text);
      classification = result.topic;
      backend = 'local:keyword-matching';
      confidence = result.confidence;
    }

    return {
      success: true,
      result: classification,
      agent: this.name,
      walletId: this.walletId,
      backend,
      confidence,
      metadata: {
        classification
      },
      llmStats: {
        attempts: this.llmAttempts,
        successes: this.llmSuccesses,
        successRate: this.llmAttempts > 0 ? (this.llmSuccesses / this.llmAttempts).toFixed(2) : 'N/A'
      }
    };
  }

  /**
   * Smart classification using GPT-5-nano
   */
  async classifyWithLlm(text) {
    const result = await llmClient.respond({
      instructions: LLM_PROMPT,
      input: text,
      maxOutputTokens: 50,
      reasoningEffort: 'low'
    });

    const normalized = result.trim().toLowerCase();

    // Validate response is a known category
    if (Object.keys(TOPICS).includes(normalized) || normalized === 'other') {
      return normalized;
    }

    // If response is not a valid category, throw error to trigger fallback
    throw new Error(`Invalid classification: ${normalized}`);
  }

  /**
   * Local keyword-based classification with confidence scoring
   */
  classifyLocal(text) {
    const lowerText = text.toLowerCase();

    const scores = Object.fromEntries(
      Object.entries(TOPICS).map(([topic, keywords]) => [
        topic,
        {
          score: keywords.reduce((acc, kw) => acc + (lowerText.includes(kw) ? 1 : 0), 0),
          keywords: keywords.length
        }
      ])
    );

    // Find best match with confidence
    let bestTopic = 'general';
    let bestScore = 0;
    let maxKeywords = 1;

    for (const [topic, { score, keywords }] of Object.entries(scores)) {
      const normalized = keywords > 0 ? score / keywords : 0;
      if (normalized > bestScore) {
        bestScore = normalized;
        bestTopic = topic;
        maxKeywords = keywords;
      }
    }

    // Calculate confidence (0-1)
    const confidence = maxKeywords > 0 ? Math.min(1, bestScore / 3) : 0.5;

    return {
      topic: bestTopic,
      confidence,
      scores: Object.fromEntries(
        Object.entries(scores).map(([topic, { score }]) => [topic, score])
      )
    };
  }
}

export default ClassifierAgent;
