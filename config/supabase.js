import { createClient } from '@supabase/supabase-js';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from './env.js';

const baseUrl = env.SUPABASE_URL.replace(/\/$/, '');
const jwksUrl = new URL(env.SUPABASE_JWKS_URL);
const jwks = createRemoteJWKSet(jwksUrl);

export const supabaseAdmin = createClient(baseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'public-ai-coding-assistant-backend'
    }
  }
});

export const supabaseAnon = createClient(baseUrl, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'public-ai-coding-assistant-backend'
    }
  }
});

export async function verifySupabaseJwt(accessToken) {
  const token = String(accessToken || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }

  const { payload, protectedHeader } = await jwtVerify(token, jwks, {
    issuer: env.SUPABASE_ISSUER,
    audience: env.SUPABASE_AUDIENCE
  });

  return {
    token,
    header: protectedHeader,
    claims: payload,
    user: {
      id: payload.sub,
      email: payload.email || null,
      role: payload.role || null,
      app_metadata: payload.app_metadata || {},
      user_metadata: payload.user_metadata || {},
      aal: payload.aal || null,
      session_id: payload.session_id || null
    }
  };
}
