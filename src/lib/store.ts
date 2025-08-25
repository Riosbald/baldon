
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'var', 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(file: string, data: any) {
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

export type Settings = {
  agentName?: string;
  introMessage?: string;
  personalityTone?: string;
  audioQuality?: 'high'|'medium'|'low';
  videoQuality?: '1080p'|'720p'|'480p';
  systemPrompt?: string;
  industryTemplate?: string;
};

export async function getSettings(sessionId: string) {
  await ensureDir();
  const data = await readJSON<Record<string, Settings>>(SETTINGS_PATH, {});
  return data[sessionId] || {};
}

export async function setSettings(sessionId: string, partial: Settings) {
  await ensureDir();
  const data = await readJSON<Record<string, Settings>>(SETTINGS_PATH, {});
  const next = { ...data[sessionId], ...partial };
  data[sessionId] = next;
  await writeJSON(SETTINGS_PATH, data);
  return next;
}
