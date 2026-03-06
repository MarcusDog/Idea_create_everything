'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [braveApiKey, setBraveApiKey] = useState('');
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showBraveKey, setShowBraveKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedClaudeKey = localStorage.getItem('claude_api_key') || '';
    const savedBraveKey = localStorage.getItem('brave_api_key') || '';
    setClaudeApiKey(savedClaudeKey);
    setBraveApiKey(savedBraveKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('claude_api_key', claudeApiKey);
    localStorage.setItem('brave_api_key', braveApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">返回首页</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">API 配置</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            配置您的API密钥以使用AI助手和联网搜索功能
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">配置已保存</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Claude API Key */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  Claude API Key
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  用于AI助手功能，可在{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Anthropic Console
                  </a>
                  {' '}获取
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type={showClaudeKey ? 'text' : 'password'}
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm"
              />
              <button
                onClick={() => setShowClaudeKey(!showClaudeKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
              >
                {showClaudeKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Brave API Key */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-start mb-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  BraveSearch API Key
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  用于联网搜索功能，可在{' '}
                  <a
                    href="https://brave.com/search/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Brave Search API
                  </a>
                  {' '}获取
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type={showBraveKey ? 'text' : 'password'}
                value={braveApiKey}
                onChange={(e) => setBraveApiKey(e.target.value)}
                placeholder="BSA..."
                className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-sm"
              />
              <button
                onClick={() => setShowBraveKey(!showBraveKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600"
              >
                {showBraveKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-400">
              <strong>提示：</strong> API密钥仅保存在浏览器本地，不会上传到服务器。请妥善保管您的密钥。
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm"
            >
              <Save className="w-5 h-5" />
              <span>保存配置</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
