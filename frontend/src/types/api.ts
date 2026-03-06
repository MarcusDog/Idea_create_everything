/**
 * API configuration type definitions
 */

export type ApiProvider = 'nvidia' | 'openai' | 'custom';

export interface ApiConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  api_key: string; // masked in responses
  base_url: string;
  model: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiConfigCreate {
  name: string;
  provider: ApiProvider;
  api_key: string;
  base_url: string;
  model: string;
  is_active?: boolean;
}

export interface ApiConfigUpdate {
  name?: string;
  provider?: ApiProvider;
  api_key?: string;
  base_url?: string;
  model?: string;
  is_active?: boolean;
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  model_info?: Record<string, any>;
}

export interface ApiBalanceResult {
  available: boolean;
  balance?: number;
  currency?: string;
  message: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

export const PROVIDER_OPTIONS: { value: ApiProvider; label: string; description: string }[] = [
  { value: 'nvidia', label: 'NVIDIA API', description: 'NVIDIA AI平台，支持多种模型' },
  { value: 'openai', label: 'OpenAI兼容', description: '兼容OpenAI API格式的服务' },
  { value: 'custom', label: '自定义API', description: '自定义API端点和配置' },
];

export const DEFAULT_MODELS: Record<ApiProvider, { value: string; label: string }[]> = {
  nvidia: [
    { value: 'moonshotai/kimi-k2.5', label: 'Kimi K2.5 (推荐)' },
    { value: 'minimaxai/minimax-m2.1', label: 'MiniMax M2.1 (快速)' },
    { value: 'z-ai/glm4.7', label: 'GLM 4.7 (中文优化)' },
  ],
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  custom: [
    { value: 'custom', label: '自定义模型' },
  ],
};
