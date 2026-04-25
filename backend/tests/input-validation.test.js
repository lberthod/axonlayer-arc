import { describe, it, expect } from 'vitest';
import { createTaskSchema } from '../src/core/validation.js';

describe('Input Validation - Prevent Short Text Submissions', () => {

  it('should reject input with less than 20 characters', () => {
    const result = createTaskSchema.safeParse({
      input: 'test',  // 4 chars
      taskType: 'summarize'
    });

    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain('at least 20 characters');
  });

  it('should reject summarize with less than 50 characters', () => {
    const result = createTaskSchema.safeParse({
      input: 'This is a text of exactly forty character',  // 40 chars
      taskType: 'summarize'
    });

    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain('too short for this task type');
  });

  it('should accept summarize with exactly 50 characters', () => {
    const result = createTaskSchema.safeParse({
      input: 'This is a valid summary text exactly fifty chars!',  // 50 chars
      taskType: 'summarize'
    });

    expect(result.success).toBe(true);
    expect(result.data.input.length).toBe(50);
  });

  it('should accept summarize with more than 50 characters', () => {
    const text = 'This is a very long text about artificial intelligence and its impact on the modern world today.';  // > 50
    const result = createTaskSchema.safeParse({
      input: text,
      taskType: 'summarize'
    });

    expect(result.success).toBe(true);
    expect(result.data.input.length).toBeGreaterThan(50);
  });

  it('should accept translate with more than 10 characters', () => {
    const result = createTaskSchema.safeParse({
      input: 'Hello world how are you',  // > 10
      taskType: 'translate'
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty input after trimming', () => {
    const result = createTaskSchema.safeParse({
      input: '   ',  // Only whitespace
      taskType: 'summarize'
    });

    expect(result.success).toBe(false);
  });

  it('should trim whitespace and validate actual content', () => {
    const result = createTaskSchema.safeParse({
      input: '   This is a valid text for summarization with more than fifty characters   ',
      taskType: 'summarize'
    });

    expect(result.success).toBe(true);
    expect(result.data.input).not.toMatch(/^\s+/);  // No leading spaces
    expect(result.data.input).not.toMatch(/\s+$/);  // No trailing spaces
  });

  it('should accept max 5000 characters', () => {
    const longText = 'A'.repeat(5000);
    const result = createTaskSchema.safeParse({
      input: longText,
      taskType: 'summarize'
    });

    expect(result.success).toBe(true);
  });

  it('should reject more than 5000 characters', () => {
    const tooLongText = 'A'.repeat(5001);
    const result = createTaskSchema.safeParse({
      input: tooLongText,
      taskType: 'summarize'
    });

    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain('too long');
  });
});
