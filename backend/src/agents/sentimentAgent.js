import BaseAgent from './baseAgent.js';
import llmClient from '../core/llmClient.js';

/**
 * SentimentAgent optimisé avec GPT-5-nano
 * Analyse de sentiments nuancée et contextuelle
 */
const LLM_PROMPT = `You are an expert at sentiment analysis. Analyze the provided text and determine its overall sentiment.

Respond with ONLY one of these in lowercase: "positive", "negative", "neutral", or "mixed"

Consider:
- Overall emotional tone
- Intensity and conviction
- Context and sarcasm
- Mixed signals

Respond with exactly one sentiment label.`;

const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'love', 'positive', 'amazing', 'wonderful', 'fantastic',
  'beautiful', 'benefit', 'success', 'progress', 'efficient', 'happy', 'joy', 'perfect',
  'awesome', 'brilliant', 'outstanding', 'incredible', 'superb', 'delightful', 'pleased',
  'grateful', 'thrilled', 'encouraging', 'optimistic', 'satisfied', 'proud', 'confident'
];

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'hate', 'negative', 'awful', 'fail', 'failure', 'risk', 'problem',
  'threat', 'sad', 'angry', 'disappointing', 'disgusting', 'horrible', 'worse', 'worst',
  'pathetic', 'waste', 'concern', 'difficulty', 'issue', 'challenge', 'regret', 'sorry',
  'blame', 'fault', 'error', 'mistake', 'broken', 'useless', 'weak', 'poor'
];

class SentimentAgent extends BaseAgent {
  constructor(walletId = 'sentiment_wallet', variant = 'default') {
    super(`Sentiment-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['sentiment'];
    this.llmAttempts = 0;
    this.llmSuccesses = 0;
  }

  async execute(input) {
    const text = typeof input.text === 'string' ? input.text.trim() : '';

    if (!text) {
      throw new Error('Text required for sentiment analysis');
    }

    let sentiment;
    let score;
    let backend = 'local';
    let confidence = 0;

    // Try LLM first for nuanced analysis
    if (llmClient.isEnabled()) {
      try {
        const llmResult = await this.analyzeWithLlm(text);
        sentiment = llmResult.sentiment;
        score = llmResult.score;
        backend = 'llm:gpt-5-nano';
        confidence = 0.95;
        this.llmSuccesses++;
      } catch (error) {
        console.warn(`[${this.name}] LLM sentiment analysis failed:`, error.message);
      }
      this.llmAttempts++;
    }

    // Fallback to keyword-based analysis
    if (!sentiment) {
      const result = this.analyzeLocal(text);
      sentiment = result.sentiment;
      score = result.score;
      backend = 'local:keyword-scoring';
      confidence = result.confidence;
    }

    return {
      success: true,
      result: sentiment,
      agent: this.name,
      walletId: this.walletId,
      backend,
      confidence,
      metadata: {
        sentiment,
        score: score.toFixed(3),
        intensity: Math.abs(score)
      },
      llmStats: {
        attempts: this.llmAttempts,
        successes: this.llmSuccesses,
        successRate: this.llmAttempts > 0 ? (this.llmSuccesses / this.llmAttempts).toFixed(2) : 'N/A'
      }
    };
  }

  /**
   * Nuanced sentiment analysis using GPT-5-nano
   */
  async analyzeWithLlm(text) {
    const result = await llmClient.respond({
      instructions: LLM_PROMPT,
      input: text,
      maxOutputTokens: 20,
      reasoningEffort: 'low'
    });

    const normalized = result.trim().toLowerCase();
    const validSentiments = ['positive', 'negative', 'neutral', 'mixed'];

    if (!validSentiments.includes(normalized)) {
      throw new Error(`Invalid sentiment: ${normalized}`);
    }

    // Map sentiment to score
    const scores = {
      positive: 0.8,
      negative: -0.8,
      neutral: 0,
      mixed: 0.2
    };

    return {
      sentiment: normalized,
      score: scores[normalized] || 0
    };
  }

  /**
   * Local keyword-based sentiment analysis with confidence
   */
  analyzeLocal(text) {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\W+/).filter(Boolean);

    // Count sentiment words
    const positiveMatches = POSITIVE_WORDS.filter(w => lowerText.includes(w)).length;
    const negativeMatches = NEGATIVE_WORDS.filter(w => lowerText.includes(w)).length;

    // Calculate normalized score
    let sentiment = 'neutral';
    let score = 0;

    if (positiveMatches > negativeMatches) {
      sentiment = 'positive';
      score = Math.min(1, positiveMatches / Math.max(1, words.length / 5));
    } else if (negativeMatches > positiveMatches) {
      sentiment = 'negative';
      score = -Math.min(1, negativeMatches / Math.max(1, words.length / 5));
    } else if (positiveMatches > 0 || negativeMatches > 0) {
      sentiment = 'mixed';
      score = 0.2;
    }

    // Calculate confidence based on signal strength
    const totalSentimentWords = positiveMatches + negativeMatches;
    const confidence = Math.min(1, totalSentimentWords / Math.max(1, words.length / 3));

    return {
      sentiment,
      score,
      confidence,
      metadata: {
        positiveWords: positiveMatches,
        negativeWords: negativeMatches,
        totalWords: words.length
      }
    };
  }
}

export default SentimentAgent;
