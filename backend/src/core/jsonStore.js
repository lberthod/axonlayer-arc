import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tiny disk-backed key/value store used by user & provider registries.
 * Writes are serialized per-instance to avoid torn JSON on the filesystem.
 */
export class JsonStore {
  constructor(relPath, defaults = {}) {
    this.filePath = path.isAbsolute(relPath)
      ? relPath
      : path.join(__dirname, '..', '..', relPath);
    this.data = { ...defaults };
    this.loaded = false;
    this.writeChain = Promise.resolve();
  }

  async load() {
    if (this.loaded) return this;
    this.loaded = true;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      await this.flush();
    }
    return this;
  }

  async flush() {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.writeChain = this.writeChain.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, snapshot);
    });
    return this.writeChain;
  }
}
