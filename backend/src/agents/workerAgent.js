import BaseAgent from './baseAgent.js';
import { config } from '../config.js';
import llmClient from '../core/llmClient.js';

/**
 * WorkerAgent avec optimisation GPT-5-nano
 * Utilise OpenAI pour qualité supérieure avec fallback local
 */
const LLM_PROMPTS = {
  summarize: `Create a concise 1-2 sentence summary. Capture the main idea and key details. Do not repeat the original text verbatim. Output only the summary.`,

  keywords: `You are an expert at identifying critical concepts and keywords. Analyze the input text deeply and extract exactly 5 of the most important, representative keywords or short phrases. These should be:
- Concepts that define the text's core content
- Specific enough to be meaningful (not generic)
- Ranked by importance/relevance
- Extractive (from the text) or derivative (key concepts)

Return ONLY as comma-separated list: keyword1, keyword2, keyword3, keyword4, keyword5`,

  rewrite: `You are a professional writer and editor. Rewrite the provided text to be:
- Clearer and more accessible
- More engaging and compelling
- Better structured and organized
- Proper grammar, spelling, flow
- Preserve ALL original meaning and information exactly
- Match original tone (formal/casual/technical)

Return ONLY the rewritten version without any commentary or explanation.`,

  translate: `You are a professional translator. Translate the provided text to {targetLang} with these principles:
- Preserve exact meaning and intent
- Maintain original tone and style
- Use natural, idiomatic {targetLang}
- Keep technical terms accurate
- Maintain formatting and structure
- No explanation, commentary, or preamble
Return ONLY the translated text.`,

  classify: `You are an expert text classifier with deep domain knowledge. Analyze the input text carefully and classify it into the MOST APPROPRIATE single category:
- business: companies, commerce, enterprise, sales, market
- technology: AI, software, blockchain, cloud, data
- science: research, experiments, discovery, physics, biology
- health: medicine, biotech, wellness, healthcare
- entertainment: movies, music, arts, culture, celebrities
- sports: athletics, games, competitions, teams
- politics: government, elections, legislation, policy
- education: learning, schools, courses, academics
- other: doesn't fit above categories

Return ONLY the category name in lowercase.`,

  sentiment: `You are an expert sentiment analyst. Analyze the input text and determine its overall sentiment with nuance:
- positive: optimistic, satisfied, encouraging, upbeat
- negative: disappointed, critical, pessimistic, frustrated
- neutral: factual, objective, informational, balanced
- mixed: contains both positive AND negative elements significantly

Consider tone, context, sarcasm, and intensity.
Return ONLY one: positive | negative | neutral | mixed`
};

class WorkerAgent extends BaseAgent {
  constructor(walletId = config.wallets.worker, variant = 'default') {
    super(`Worker-${variant}`, walletId);
    this.variant = variant;
    this.taskTypes = ['summarize', 'keywords', 'rewrite', 'translate', 'classify', 'sentiment'];
    this.llmAttempts = 0;
    this.llmSuccesses = 0;
  }

  /**
   * Execute task with LLM-first strategy for maximum quality
   */
  async execute(input) {
    const taskType = input.taskType || 'summarize';
    const text = typeof input.text === 'string' ? input.text.trim() : '';

    console.log(`[${this.name}:execute] Starting task: taskType=${taskType}, textLength=${text.length}`);

    if (!text) {
      console.error(`[${this.name}:execute] ERROR: Input text required`);
      throw new Error('Input text required');
    }

    let result;
    let backend = 'local';
    let confidence = 0;

    // Try LLM first for quality
    if (llmClient.isEnabled()) {
      try {
        console.log(`[${this.name}:execute] Trying LLM backend (model: ${config.llm.model})...`);
        console.log(`[${this.name}:execute] Input length: ${text.length} chars, Task: ${taskType}`);
        result = await this.executeWithLlm(taskType, text, input.targetLang);
        if (!result || result.trim().length === 0) {
          throw new Error('LLM returned empty result');
        }
        backend = `llm:${config.llm.model}`;
        confidence = 0.95; // High confidence from LLM
        this.llmSuccesses++;
        console.log(`[${this.name}:execute] ✓ LLM succeeded via ${config.llm.model}, result length=${result.length}`);
      } catch (error) {
        console.warn(`[${this.name}:execute] LLM failed: ${error.message}`);
        console.warn(`[${this.name}:execute] Falling back to local algorithm...`);
      }
      this.llmAttempts++;
    }

    // Fallback to local algorithm if LLM fails
    if (!result) {
      console.log(`[${this.name}:execute] Using fallback local algorithm`);
      const fallback = this.executeLocal(taskType, text);
      result = fallback.result;
      backend = `local:${taskType}`;
      confidence = fallback.confidence;
      console.log(`[${this.name}:execute] ✓ Local fallback succeeded, result length=${result.length}`);
    }

    return {
      success: true,
      result,
      agent: this.name,
      walletId: this.walletId,
      backend,
      confidence,
      llmStats: {
        attempts: this.llmAttempts,
        successes: this.llmSuccesses,
        successRate: this.llmAttempts > 0 ? (this.llmSuccesses / this.llmAttempts).toFixed(2) : 'N/A'
      }
    };
  }

  /**
   * Execute with OpenAI GPT-5-nano
   */
  async executeWithLlm(taskType, text, targetLang) {
    let prompt = LLM_PROMPTS[taskType];

    if (!prompt) {
      throw new Error(`Unsupported task type: ${taskType}`);
    }

    // Handle parameterized prompts
    if (prompt.includes('{targetLang}')) {
      prompt = prompt.replace('{targetLang}', targetLang || 'English');
    }

    // Use LLM with optimized parameters
    const result = await llmClient.respond({
      instructions: prompt,
      input: text,
      maxOutputTokens: this.getOptimalTokenLimit(taskType),
      reasoningEffort: 'low' // Fast inference for cost optimization
    });

    if (!result || result.trim().length === 0) {
      throw new Error('LLM returned empty result');
    }

    return result.trim();
  }

  /**
   * Local fallback implementations
   */
  executeLocal(taskType, text) {
    switch (taskType) {
      case 'summarize':
        return { result: this.summarizeLocal(text), confidence: 0.7 };
      case 'keywords':
        return { result: this.extractKeywordsLocal(text), confidence: 0.65 };
      case 'rewrite':
        return { result: this.rewriteLocal(text), confidence: 0.6 };
      case 'translate':
        return { result: this.translateLocal(text), confidence: 0.5 };
      case 'classify':
        return { result: this.classifyLocal(text), confidence: 0.75 };
      case 'sentiment':
        return { result: this.sentimentLocal(text), confidence: 0.7 };
      default:
        return { result: this.summarizeLocal(text), confidence: 0.5 };
    }
  }

  /**
   * Smart local summarization using intelligent sentence selection
   * Picks the 1-2 most important sentences that capture the essence
   */
  summarizeLocal(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);

    if (sentences.length === 0) {
      const words = cleaned.split(' ').filter(Boolean);
      return words.slice(0, 15).join(' ') + (words.length > 15 ? '...' : '');
    }

    if (sentences.length === 1) {
      return sentences[0].length > 200 ? sentences[0].slice(0, 200) + '...' : sentences[0];
    }

    // Score sentences by informativeness (length + keyword presence)
    const scoredSentences = sentences.map((sent, idx) => {
      const words = sent.split(/\s+/).length;
      const score = Math.min(1, words / 20) + (idx === 0 ? 0.3 : 0); // Slight boost to first
      return { sentence: sent, score, index: idx };
    });

    // Select top 1-2 sentences by score, preferring diverse positions
    const selected = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .sort((a, b) => a.index - b.index) // Re-order by appearance
      .map(s => s.sentence);

    return selected.join(' ');
  }

  /**
   * Improved keyword extraction with TF-IDF-like scoring
   */
  extractKeywordsLocal(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
      'with', 'by', 'from', 'about', 'as', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
      'again', 'further', 'then', 'once', 'was', 'were', 'be', 'been', 'being',
      'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Count word frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Sort by frequency and return top 5
    const topKeywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return topKeywords.join(', ') || 'no keywords found';
  }

  /**
   * Enhanced local rewriting with case preservation
   */
  rewriteLocal(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';

    // Basic rewrite: capitalize and add subtle variation
    const rewritten = cleaned
      .charAt(0).toUpperCase() +
      cleaned.slice(1)
      .replace(/\b(is|are)\b/g, (match) => match === 'is' ? 'is' : 'are')
      .replace(/\b(very)\b/g, 'quite');

    return rewritten;
  }

  /**
   * Local translation fallback (English only)
   */
  translateLocal(text) {
    // Since we can't truly translate locally, return explanation
    return `[Translation not available locally: ${text.substring(0, 50)}...]`;
  }

  /**
   * Smart text classification based on keyword presence
   */
  classifyLocal(text) {
    const lowerText = text.toLowerCase();

    const categories = {
      business: ['business', 'company', 'market', 'sales', 'profit', 'investment', 'finance'],
      technology: ['technology', 'software', 'code', 'app', 'tech', 'digital', 'data', 'ai'],
      science: ['science', 'research', 'study', 'experiment', 'theory', 'scientific'],
      health: ['health', 'medical', 'disease', 'treatment', 'doctor', 'hospital', 'wellness'],
      entertainment: ['movie', 'music', 'entertainment', 'film', 'actor', 'show', 'celebrity'],
      sports: ['sport', 'game', 'team', 'player', 'match', 'tournament', 'athletic'],
      politics: ['political', 'government', 'vote', 'election', 'parliament', 'politician'],
      education: ['education', 'school', 'university', 'student', 'learning', 'teacher'],
    };

    let bestCategory = 'other';
    let maxMatches = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const matches = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * Local sentiment analysis using keyword scoring
   */
  sentimentLocal(text) {
    const lowerText = text.toLowerCase();

    const positive = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
      'happy', 'joy', 'beautiful', 'perfect', 'awesome', 'brilliant', 'outstanding'
    ];

    const negative = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'ugly',
      'worst', 'poor', 'disappointing', 'disgusting', 'pathetic', 'regret'
    ];

    const positiveMatches = positive.filter(w => lowerText.includes(w)).length;
    const negativeMatches = negative.filter(w => lowerText.includes(w)).length;

    if (positiveMatches > negativeMatches) return 'positive';
    if (negativeMatches > positiveMatches) return 'negative';
    return 'neutral';
  }

  /**
   * Get optimal token limit based on task type
   * IMPORTANT: Must be high enough for LLM to complete without hitting max_output_tokens limit
   */
  getOptimalTokenLimit(taskType) {
    const limits = {
      summarize: 512,      // Increased from 150 - needs space to complete
      keywords: 256,       // Increased from 100
      rewrite: 1024,       // Increased from 500
      translate: 1024,     // Increased from 500
      classify: 128,       // Increased from 50
      sentiment: 128       // Increased from 50
    };
    return limits[taskType] || 256;
  }
}

export default WorkerAgent;
