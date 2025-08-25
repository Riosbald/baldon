
export type ModelKey =
  | 'deepseek-r1'
  | 'gpt-4-turbo'
  | 'claude-3-opus'
  | 'gemini-pro'
  | 'llama3-70b'
  | 'mistral-large'
  | 'palm-2'
  | 'custom';

export const MODELS: { key: ModelKey; label: string }[] = [
  { key: 'deepseek-r1', label: 'DeepSeek R1 Reasoning' },
  { key: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { key: 'claude-3-opus', label: 'Claude 3 Opus' },
  { key: 'gemini-pro', label: 'Gemini Pro' },
  { key: 'llama3-70b', label: 'Llama 3 70B' },
  { key: 'mistral-large', label: 'Mistral Large' },
  { key: 'palm-2', label: 'PaLM 2' },
  { key: 'custom', label: 'Custom Enterprise Model' },
];

export function modelLabel(key: ModelKey) {
  return MODELS.find((m) => m.key === key)?.label ?? key;
}
