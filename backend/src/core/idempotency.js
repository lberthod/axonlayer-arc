import { config } from '../config.js';

/**
 * Very small in-memory idempotency store. For a single-node deployment this is
 * enough to dedupe double-clicks and flaky-network retries on POST /api/tasks.
 * For multi-node, back this with Redis.
 *
 * Client supplies `Idempotency-Key` header. The first request with a given
 * (uid|ip, key) pair is executed and its response is cached; subsequent
 * identical requests return the cached response for up to TTL ms.
 */

const cache = new Map(); // mapKey -> { expiresAt, status, body, inflight? }

function makeKey(req, header) {
  const who = req.user?.uid || req.ip || 'anon';
  return `${who}::${header}`;
}

function sweep() {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt < now) cache.delete(k);
  }
}

export function idempotencyMiddleware() {
  const ttl = config.security.idempotencyTtlMs;

  return (req, res, next) => {
    const header = req.header('idempotency-key');
    if (!header) return next();
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(header)) {
      return res.status(400).json({
        error: {
          code: 'invalid_idempotency_key',
          message: 'Idempotency-Key must match [A-Za-z0-9_-]{8,128}',
          requestId: req.id || null
        }
      });
    }

    sweep();
    const key = makeKey(req, header);
    const cached = cache.get(key);

    if (cached && !cached.inflight) {
      res.setHeader('Idempotent-Replay', 'true');
      return res.status(cached.status).json(cached.body);
    }

    if (cached?.inflight) {
      return res.status(409).json({
        error: {
          code: 'idempotent_inflight',
          message: 'a request with this Idempotency-Key is still being processed',
          requestId: req.id || null
        }
      });
    }

    cache.set(key, { inflight: true, expiresAt: Date.now() + ttl });

    // Capture res.json to persist the first successful response.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, {
        inflight: false,
        status: res.statusCode,
        body,
        expiresAt: Date.now() + ttl
      });
      return originalJson(body);
    };

    // Release the inflight lock on error so the caller can retry.
    res.on('close', () => {
      const entry = cache.get(key);
      if (entry?.inflight) cache.delete(key);
    });

    next();
  };
}

export function _resetIdempotencyForTests() {
  cache.clear();
}
