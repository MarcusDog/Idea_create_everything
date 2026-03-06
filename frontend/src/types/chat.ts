/**
 * Chat and AI type definitions
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  project_id: string;
  messages: ChatMessage[];
  model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  project_id: string;
  session_id?: string;
  model?: string;
  context?: ChatContext;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  model: string;
  usage?: TokenUsage;
}

export interface ChatContext {
  project_name?: string;
  project_description?: string;
  domain?: string;
  tree_data?: any;
  recent_messages?: ChatMessage[];
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  usage?: TokenUsage;
}

export interface AiAnalyzeRequest {
  idea: string;
  domain?: string;
  project_id?: string;
}

export interface AiAnalyzeResponse {
  domain: string;
  summary: string;
  tree_structure: any;
  questions: string[];
  suggestions: string[];
}

export interface AiExpandRequest {
  node_id: string;
  node_title: string;
  node_description: string;
  project_context?: string;
}

export interface AiExpandResponse {
  children: {
    title: string;
    description: string;
    status: string;
  }[];
  suggestions: string[];
}
