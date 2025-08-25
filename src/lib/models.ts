
export type ModelKey =
  | 'deepseek-r1'
  | 'gpt-4-turbo'
  | 'claude-3-opus'
  | 'gemini-pro'
  | 'llama3-70b'
  | 'mistral-large'
  | 'palm-2'
  | 'custom';

type ModelInfo = { key: ModelKey; label: string; vendor: 'openai'|'anthropic'|'google'|'together'|'custom' };

export const MODELS: ModelInfo[] = [
  { key: 'deepseek-r1', label: 'DeepSeek R1 Reasoning', vendor: 'openai' },
  { key: 'gpt-4-turbo', label: 'GPT-4 Turbo', vendor: 'openai' },
  { key: 'claude-3-opus', label: 'Claude 3 Opus', vendor: 'anthropic' },
  { key: 'gemini-pro', label: 'Gemini Pro', vendor: 'google' },
  { key: 'llama3-70b', label: 'Llama 3 70B', vendor: 'together' },
  { key: 'mistral-large', label: 'Mistral Large', vendor: 'together' },
  { key: 'palm-2', label: 'PaLM 2', vendor: 'google' },
  { key: 'custom', label: 'Custom Enterprise Model', vendor: 'custom' },
];

export function modelLabel(key: ModelKey) {
  return MODELS.find((m) => m.key === key)?.label ?? key;
}
