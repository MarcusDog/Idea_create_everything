/**
 * Chat API module
 * Handles AI chat and conversation API calls
 */

import apiClient from './client';
import type { ChatMessage, ChatRequest, ChatResponse } from '@/types/chat';

// Types matching backend schemas
export interface Conversation {
  id: string;
  project_id: string;
  session_id: string;
  messages: ChatMessage[];
  model: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessageRequest {
  message: string;
  session_id?: string;
  model?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  session_id: string;
  tokens_used: number;
  model: string;
}

// Chat API endpoints
export const chatApi = {
  /**
   * Send a chat message to AI
   */
  sendMessage: async (
    projectId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    return apiClient.post<SendMessageResponse>(`/chat/project/${projectId}`, data);
  },

  /**
   * Get chat history for a project
   */
  getHistory: async (
    projectId: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<Conversation[]> => {
    return apiClient.get<Conversation[]>(
      `/chat/project/${projectId}/history?skip=${skip}&limit=${limit}`
    );
  },

  /**
   * Get a specific chat session
   */
  getSession: async (sessionId: string): Promise<Conversation> => {
    return apiClient.get<Conversation>(`/chat/session/${sessionId}`);
  },

  /**
   * Delete a chat session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete<void>(`/chat/session/${sessionId}`);
  },

  /**
   * Send a streaming chat message
   */
  sendMessageStream: async (
    projectId: string,
    data: SendMessageRequest,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): Promise<void> => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/project/${projectId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'chunk') {
                onChunk(parsed.content);
              } else if (parsed.type === 'error') {
                onError(parsed.content);
                return;
              } else if (parsed.type === 'done') {
                onDone();
                return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      onDone();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  },
};

export default chatApi;
