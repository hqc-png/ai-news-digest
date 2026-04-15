export interface AIConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
  baseURL?: string;
}

export function getAIConfig(): AIConfig | null {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      baseURL: process.env.ANTHROPIC_BASE_URL,
    };
  }

  return {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}
