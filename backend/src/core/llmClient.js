import { config } from '../config.js';

/**
 * OpenAI Responses API client.
 *
 * Uses POST /v1/responses with { model, instructions, input } and returns
 * the aggregated `output_text`. Pinned to a reasoning-capable gpt-5 snapshot
 * by default (see config.llm.model) — we follow OpenAI's recommendation to
 * pin production apps to a specific snapshot for deterministic behaviour.
 *
 * Call shape mirrors the official SDK:
 *   client.responses.create({ model, instructions, input, reasoning })
 *
 * Works with any endpoint that implements the Responses API. For
 * Chat-Completions-only backends (Ollama, vLLM, Groq...) set
 * OPENAI_BASE_URL accordingly — this client intentionally does not fall
 * back to /chat/completions because the user requested a single, unified
 * logic.
 */
class LlmClient {
  isEnabled() {
    return Boolean(config.llm.enabled && config.llm.apiKey);
  }

  /**
   * @param {object} opts
   * @param {string} [opts.instructions]  high-level system-style directive
   * @param {string} opts.input           user input (plain string)
   * @param {string} [opts.model]         override the default pinned model
   * @param {number} [opts.maxOutputTokens]
   * @param {'minimal'|'low'|'medium'|'high'} [opts.reasoningEffort]
   * @returns {Promise<string>} aggregated `output_text`
   */
  async respond({ instructions, input, model, maxOutputTokens, reasoningEffort } = {}) {
    if (!this.isEnabled()) throw new Error('llm disabled');
    if (typeof input !== 'string' || !input.trim()) {
      throw new Error('llm input required');
    }

    const url = `${config.llm.baseUrl.replace(/\/+$/, '')}/responses`;
    const body = {
      model: model || config.llm.model,
      input,
      max_output_tokens: maxOutputTokens || config.llm.maxOutputTokens,
      reasoning: { effort: reasoningEffort || config.llm.reasoningEffort }
    };
    if (instructions) body.instructions = instructions;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`LLM call failed: ${response.status} ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return this.#extractOutputText(data);
  }

  /**
   * The Responses API output is an array that may contain reasoning blocks,
   * tool calls and one or more messages. `output_text` is a convenience field
   * some SDKs add; when absent, walk output[].content[] for any `output_text`
   * entries and concatenate them.
   */
  #extractOutputText(data) {
    if (typeof data.output_text === 'string' && data.output_text.length) {
      return data.output_text.trim();
    }

    const pieces = [];
    for (const item of data.output || []) {
      if (item.type !== 'message') continue;
      for (const part of item.content || []) {
        if (part.type === 'output_text' && typeof part.text === 'string') {
          pieces.push(part.text);
        }
      }
    }
    return pieces.join('\n').trim();
  }
}

export default new LlmClient();
