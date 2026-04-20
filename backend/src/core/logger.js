import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import { config } from '../config.js';

export const logger = pino({
  level: config.security.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.apiKey',
      '*.privateKey'
    ],
    censor: '[REDACTED]'
  }
});

export function httpLogger() {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'];
      const id = existing || crypto.randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip
      })
    }
  });
}
