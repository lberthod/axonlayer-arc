import client from 'prom-client';

/**
 * Prometheus instrumentation.
 *
 * Exposed metrics:
 *   - default Node.js runtime metrics (event loop, GC, heap, CPU, handles)
 *   - http_requests_total{method,route,status}
 *   - http_request_duration_seconds{method,route,status}
 *   - tasks_total{task_type,status}
 *   - usdc_volume_total{kind}  (kind = gross | worker | validator | margin)
 */

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [register]
});

export const tasksTotal = new client.Counter({
  name: 'tasks_total',
  help: 'Total tasks processed',
  labelNames: ['task_type', 'status'],
  registers: [register]
});

export const usdcVolumeTotal = new client.Counter({
  name: 'usdc_volume_total',
  help: 'Cumulative USDC moved across the network, labelled by recipient kind',
  labelNames: ['kind'],
  registers: [register]
});

/**
 * Express middleware that records http_requests_total and
 * http_request_duration_seconds. We resolve route at response time so it maps
 * to the matched Express path pattern (e.g. `/api/tasks/:id`) instead of the
 * raw URL.
 */
export function httpMetricsMiddleware() {
  return (req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path
        ? `${req.baseUrl || ''}${req.route.path}`
        : req.originalUrl.split('?')[0];
      const labels = {
        method: req.method,
        route,
        status: String(res.statusCode)
      };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  };
}

/**
 * Called by the orchestrator after a task completes. Keeps the Prometheus
 * counters in sync with the JSON metrics already exposed at /api/metrics.
 */
export function recordTaskMetric({ taskType, status, pricing }) {
  tasksTotal.inc({ task_type: taskType || 'unknown', status: status || 'unknown' });
  if (status === 'completed' && pricing) {
    usdcVolumeTotal.inc({ kind: 'gross' }, Number(pricing.clientPayment) || 0);
    usdcVolumeTotal.inc({ kind: 'worker' }, Number(pricing.workerPayment) || 0);
    usdcVolumeTotal.inc({ kind: 'validator' }, Number(pricing.validatorPayment) || 0);
    usdcVolumeTotal.inc({ kind: 'margin' }, Number(pricing.orchestratorMargin) || 0);
  }
}
