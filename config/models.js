import { env } from './env.js';

const puterModelId = (value, fallback) => value || fallback;

export const MODEL_REGISTRY = {
  claude_fable_5: {
    key: 'claude_fable_5',
    label: 'Claude Fable 5',
    provider: 'puter',
    modelId: puterModelId(env.MODEL_CLAUDE_FABLE_5_ID, 'anthropic/claude-fable-5'),
    creditMultiplier: 1.45,
    inputMultiplier: 1.0,
    outputMultiplier: 1.5,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    family: 'claude'
  },
  gpt_5_6_sol: {
    key: 'gpt_5_6_sol',
    label: 'GPT-5.6 Sol',
    provider: 'puter',
    modelId: puterModelId(env.MODEL_GPT_5_6_SOL_ID, 'gpt-5.6-sol'),
    creditMultiplier: 1.3,
    inputMultiplier: 1.0,
    outputMultiplier: 1.35,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    family: 'gpt'
  },
  gemini: {
    key: 'gemini',
    label: 'Gemini',
    provider: 'puter',
    modelId: puterModelId(env.MODEL_GEMINI_ID, 'google/gemini'),
    creditMultiplier: 1.05,
    inputMultiplier: 0.95,
    outputMultiplier: 1.1,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    family: 'gemini'
  },
  qwen3_coder: {
    key: 'qwen3_coder',
    label: 'Qwen3 Coder',
    provider: 'puter',
    modelId: puterModelId(env.MODEL_QWEN3_CODER_ID, 'qwen/qwen3-coder'),
    creditMultiplier: 1.1,
    inputMultiplier: 0.95,
    outputMultiplier: 1.2,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    family: 'qwen'
  },
  deepseek_coder: {
    key: 'deepseek_coder',
    label: 'DeepSeek Coder',
    provider: 'puter',
    modelId: puterModelId(env.MODEL_DEEPSEEK_CODER_ID, 'deepseek/deepseek-coder'),
    creditMultiplier: 1.0,
    inputMultiplier: 0.9,
    outputMultiplier: 1.05,
    maxOutputTokens: 8192,
    contextWindow: 200000,
    family: 'deepseek'
  }
};

export const MODEL_KEYS = Object.keys(MODEL_REGISTRY);

export function getModelByKeyOrLabel(model) {
  if (!model) return null;
  const normalized = String(model).trim().toLowerCase().replace(/[\s\-]+/g, '_');
  if (MODEL_REGISTRY[normalized]) return MODEL_REGISTRY[normalized];

  const match = Object.values(MODEL_REGISTRY).find((item) => {
    const label = item.label.toLowerCase();
    const modelId = item.modelId.toLowerCase();
    const key = item.key.toLowerCase();
    const input = String(model).toLowerCase();
    return label === input || modelId === input || key === normalized;
  });

  return match || null;
}
