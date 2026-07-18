import { createClient } from 'redis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const localStores = new Map();
let redisClientPromise = null;

function makeKey(prefix, identifier) {
  return `${prefix}:${identifier}`;
}

function getLocalStore(prefix) {
  if (!localStores.has(prefix)) {
    localStores.set(prefix, new Map());
  }
  return localStores.get(prefix);
}

async function getRedisClient() {
  if (!env.ENABLE_REDIS_RATE_LIMITING || !env.REDIS_URL) return null;
  if (!redisClientPromise) {
    const client = createClient({ url: env.REDIS_URL });
    client.on('error', (error) => {
      logger.warn({ message: 'Redis rate limit client error', error: error.message });
    });
    redisClientPromise = client.connect().then(() => client).catch((error) => {
      logger.warn({ message: 'Redis rate limiting disabled', error: error.message });
      redisClientPromise = null;
      return null;
    });
  }
  return redisClientPromise;
}

async function consumeRedisLimit({ prefix, identifier, windowMs, max }) {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const key = makeKey(prefix, identifier);
    const hits = await client.incr(key);
    if (hits === 1) {
      await client.pExpire(key, windowMs);
    }
    const ttl = await client.pTTL(key);
    const resetAfter = ttl > 0 ? ttl : windowMs;

    return {
      totalHits: hits,
      remaining: Math.max(0, max - hits),
      resetTime: new Date(Date.now() + resetAfter),
      limit: max
    };
  } catch (error) {
    logger.warn({ message: 'Redis rate limiting fallback to memory', error: error.message });
    return null;
  }
}

async function consumeMemoryLimit({ prefix, identifier, windowMs, max }) {
  const store = getLocalStore(prefix);
  const key = makeKey(prefix, identifier);
  const now = Date.now();
  const existing = store.get(key);
  const record = !existing || existing.resetAt <= now
    ? { hits: 0, resetAt: now + windowMs }
    : existing;

  record.hits += 1;
  record.resetAt = record.resetAt || (now + windowMs);
  store.set(key, record);

  return {
    totalHits: record.hits,
    remaining: Math.max(0, max - record.hits),
    resetTime: new Date(record.resetAt),
    limit: max
  };
}

function getIdentifier(req, prefix) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const userId = req.user?.id || 'anon';
  return `${ip}:${userId}:${prefix}`;
}

function makeMiddleware({ windowMs, max, prefix, message }) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const identifier = getIdentifier(req, prefix);
      const snapshot = await consumeRedisLimit({ prefix, identifier, windowMs, max })
        || await consumeMemoryLimit({ prefix, identifier, windowMs, max });

      const remaining = Math.max(0, snapshot.remaining);
      const resetSeconds = Math.max(1, Math.ceil((snapshot.resetTime.getTime() - Date.now()) / 1000));

      res.setHeader('RateLimit-Limit', String(snapshot.limit));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(resetSeconds));
      res.setHeader('Retry-After', String(resetSeconds));

      if (snapshot.totalHits > max) {
        return res.status(429).json({
          success: false,
          message
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const apiRateLimiter = makeMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  prefix: 'api',
  message: 'Too many requests. Please slow down.'
});

export const authRateLimiter = makeMiddleware({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  prefix: 'auth',
  message: 'Too many authentication requests.'
});

export const uploadRateLimiter = makeMiddleware({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: Math.max(20, Math.floor(env.RATE_LIMIT_MAX / 4)),
  prefix: 'upload',
  message: 'Too many upload requests.'
});
