
export type Settings = {
  agentName?: string
  introMessage?: string
  personalityTone?: string
  audioQuality?: 'high'|'medium'|'low'
  videoQuality?: '1080p'|'720p'|'480p'
  systemPrompt?: string
  industryTemplate?: string
  ttsProvider?: 'elevenlabs'|'google'|'aws'
  sttProvider?: 'openai'|'google'|'aws'
  voice?: string
}
