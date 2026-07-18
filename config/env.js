import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(10000),

  FRONTEND_URL: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default(''),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWKS_URL: z.string().optional().default(''),
  SUPABASE_ISSUER: z.string().optional().default(''),
  SUPABASE_AUDIENCE: z.string().optional().default('authenticated'),

  PUTER_BASE_URL: z.string().url().default('https://api.puter.com/puterai/openai/v1/'),
  PUTER_AUTH_TOKEN: z.string().min(1),

  MODEL_CLAUDE_FABLE_5_ID: z.string().optional().default(''),
  MODEL_GPT_5_6_SOL_ID: z.string().optional().default('gpt-5.6-sol'),
  MODEL_GEMINI_ID: z.string().optional().default(''),
  MODEL_QWEN3_CODER_ID: z.string().optional().default(''),
  MODEL_DEEPSEEK_CODER_ID: z.string().optional().default(''),

  DAILY_CREDIT_LIMIT: z.coerce.number().int().positive().default(1000),

  REQUEST_BODY_LIMIT: z.string().default('1mb'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(25),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_ENABLE_SCANNING: z.string().optional().default('true'),
  UPLOAD_ZIP_MAX_ENTRIES: z.coerce.number().int().positive().default(1000),
  UPLOAD_ZIP_MAX_UNCOMPRESSED_MB: z.coerce.number().int().positive().default(50),
  UPLOAD_ZIP_MAX_RATIO: z.coerce.number().positive().default(25),

  REDIS_URL: z.string().optional().default(''),
  ENABLE_REDIS_RATE_LIMITING: z.string().optional().default('true'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),

  METRICS_ENABLED: z.string().optional().default('true'),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${details}`);
}

const raw = parsed.data;

function asBoolean(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() !== 'false';
}

export const env = {
  ...raw,
  FRONTEND_URL: raw.FRONTEND_URL || '',
  ALLOWED_ORIGINS: raw.ALLOWED_ORIGINS || '',
  REDIS_URL: raw.REDIS_URL || '',
  UPLOAD_ENABLE_SCANNING: asBoolean(raw.UPLOAD_ENABLE_SCANNING, true),
  ENABLE_REDIS_RATE_LIMITING: asBoolean(raw.ENABLE_REDIS_RATE_LIMITING, true),
  METRICS_ENABLED: asBoolean(raw.METRICS_ENABLED, true),
  SUPABASE_ISSUER:
    raw.SUPABASE_ISSUER || `${raw.SUPABASE_URL.replace(/\/$/, '')}/auth/v1`,
  SUPABASE_JWKS_URL:
    raw.SUPABASE_JWKS_URL || `${raw.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`
};
