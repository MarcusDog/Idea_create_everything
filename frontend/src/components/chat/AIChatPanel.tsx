'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface AIChatPanelProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  onAIResponse?: (response: string) => void;
}

export function AIChatPanel({
  projectId,
  projectTitle,
  projectDescription,
  onAIResponse,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是你的AI项目助手。我正在帮你完善"${projectTitle}"项目。你可以描述你的想法，我会帮你完善项目结构。`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    // Create placeholder message for streaming
    const assistantMessageId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Try streaming endpoint first
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/project/${projectId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          session_id: sessionId,
        }),
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
      let fullContent = '';
      let modelUsed = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'chunk') {
                fullContent += parsed.content;
                // Update message in real-time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              } else if (parsed.type === 'done') {
                fullContent = parsed.full_content || fullContent;
                modelUsed = parsed.model || 'ai';
              } else if (parsed.type === 'error') {
                throw new Error(parsed.content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Update final message with metadata
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: fullContent,
                metadata: {
                  model: modelUsed,
                  tokens_used: Math.round(fullContent.length / 4),
                },
              }
            : msg
        )
      );

      if (onAIResponse) {
        onAIResponse(fullContent);
      }
    } catch (error) {
      console.warn('Streaming API not available, using mock response:', error);

      // Remove empty placeholder
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));

      // Mock response for local development
      setTimeout(() => {
        const mockResponse = generateMockResponse(currentInput, projectTitle);
        const mockMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: mockResponse,
          timestamp: new Date().toISOString(),
          metadata: {
            model: 'local-mock',
            tokens_used: mockResponse.length / 4,
          },
        };

        setMessages((prev) => [...prev, mockMessage]);

        if (onAIResponse) {
          onAIResponse(mockResponse);
        }
        setIsLoading(false);
      }, 1000);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI 助手</h2>
            <p className="text-xs text-slate-500">
              让AI帮你完善项目想法
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] flex space-x-2 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.metadata?.model && (
                  <p className="text-xs mt-1 opacity-60">
                    {message.metadata.model}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] flex space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}

// Generate mock response for local development
function generateMockResponse(input: string, projectTitle: string): string {
  const responses = [
    `这是一个很好的想法！让我帮你分析一下"${projectTitle}"这个项目。\n\n首先，我建议你考虑以下几个方面：\n\n1. **目标用户群体**：明确你的目标用户是谁\n2. **核心功能**：确定项目的核心功能点\n3. **技术选型**：选择合适的技术栈\n4. **市场分析**：研究竞品和市场机会\n\n你可以告诉我更多细节，我会帮你进一步完善项目结构。`,

    `谢谢你的分享！基于你的描述，我为"${projectTitle}"项目整理了一些建议：\n\n**项目亮点：**\n- 解决了明确的用户痛点\n- 具有创新性和差异化\n\n**建议改进：**\n- 增加用户反馈机制\n- 考虑数据安全和隐私保护\n- 设计清晰的商业模式\n\n你想先深入讨论哪个方面？`,

    `明白了！对于"${projectTitle}"，我建议按以下步骤推进：\n\n1. **市场调研** - 验证需求\n2. **MVP设计** - 最小可行产品\n3. **技术架构** - 选择合适的技术方案\n4. **运营策略** - 推广和获客\n\n我可以帮你详细展开任何一个环节。你想从哪里开始？`,
  ];

  // Simple hash to get consistent response for same input
  const hash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return responses[hash % responses.length];
}

export default AIChatPanel;
