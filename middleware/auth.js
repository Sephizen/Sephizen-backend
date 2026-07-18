import crypto from 'node:crypto';
import { verifySupabaseJwt } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

const tokenCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheKey(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getCached(token) {
  const key = cacheKey(token);
  const item = tokenCache.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) {
    tokenCache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(token, value) {
  const tokenExpiryMs = Number(value?.claims?.exp ? value.claims.exp * 1000 : 0);
  const expiresAt = tokenExpiryMs > 0
    ? Math.min(Date.now() + CACHE_TTL_MS, tokenExpiryMs)
    : Date.now() + CACHE_TTL_MS;

  tokenCache.set(cacheKey(token), {
    value,
    expiresAt
  });
}

export async function requireAuth(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new ApiError(401, 'Authorization token is required');
    }

    const cached = getCached(token);
    if (cached) {
      req.auth = cached;
      req.user = cached.user;
      return next();
    }

    const verified = await verifySupabaseJwt(token);
    setCached(token, verified);

    req.auth = verified;
    req.user = verified.user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, 'Invalid or expired Supabase token'));
  }
}
