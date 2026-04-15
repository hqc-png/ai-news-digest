/**
 * AI Configuration Module
 * 管理 AI API 配置（Anthropic Claude / OpenAI GPT）
 */

import type { AIConfig } from './types';

/**
 * 从环境变量获取 AI 配置
 *
 * 优先级：ANTHROPIC_API_KEY > OPENAI_API_KEY
 *
 * @param env - Cloudflare 环境变量对象（可选，用于 Workers）
 * @returns AI 配置对象，如果没有配置则返回 null
 */
export function getAIConfig(env?: any): AIConfig | null {
  // 优先从 Cloudflare env 读取（Workers/Pages Functions）
  const anthropicKey = env?.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  const openaiKey = env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    console.warn('⚠️  No AI API key found. Will use fallback summarization.');
    return null;
  }

  if (anthropicKey) {
    return {
      provider: 'anthropic',
      apiKey: anthropicKey,
      model: env?.ANTHROPIC_MODEL || process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
      baseURL: env?.ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL,
    };
  }

  return {
    provider: 'openai',
    apiKey: openaiKey!,
    model: env?.OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}
