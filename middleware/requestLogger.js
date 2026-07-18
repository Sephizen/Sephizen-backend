import { performance } from 'node:perf_hooks';
import { recordRequestMetric } from '../services/metricsService.js';

export function requestLogger(req, res, next) {
  const startedAt = performance.now();

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startedAt);
    const payload = {
      requestId: req.requestId || null,
      userId: req.user?.id || null,
      modelKey: req.selectedModelKey || null,
      creditsUsed: Number(req.creditsUsed || 0),
      processingTimeMs: durationMs,
      success: res.statusCode < 400,
      statusCode: res.statusCode,
      method: req.method,
      path: req.originalUrl
    };

    recordRequestMetric(payload);

    if (req.user && req.logRequest !== false && req.app?.locals?.usageLogger) {
      req.app.locals.usageLogger({
        userId: payload.userId,
        selectedModel: payload.modelKey,
        creditsUsed: payload.creditsUsed,
        requestTimestamp: new Date().toISOString(),
        processingTimeMs: payload.processingTimeMs,
        success: payload.success
      }).catch(() => {});
    }
  });

  next();
}
