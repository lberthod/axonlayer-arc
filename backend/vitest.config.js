import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Integration tests share the on-disk ledger/task stores → run them
    // one file at a time.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.js', 'src/agents/**/*.js'],
      exclude: ['src/core/auth.js', 'src/core/llmClient.js', 'src/core/walletManager.js'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 55,
        functions: 55,
        statements: 55,
        branches: 50
      }
    }
  }
});
