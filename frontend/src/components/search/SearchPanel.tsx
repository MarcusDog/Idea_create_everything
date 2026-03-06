'use client';

import { useState, useCallback } from 'react';
import { Search, Globe, Loader2, ExternalLink, X, RefreshCw } from 'lucide-react';

interface SearchResult {
  title: string;
  description: string;
  url: string;
  age?: string;
}

interface SearchPanelProps {
  projectDomain?: string;
  onClose?: () => void;
}

export function SearchPanel({ projectDomain, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'web' | 'market'>('web');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      let url: string;
      if (searchType === 'market' && projectDomain) {
        url = `${API_BASE_URL}/api/v1/search/market?domain=${encodeURIComponent(projectDomain)}&topic=${encodeURIComponent(query)}`;
      } else {
        url = `${API_BASE_URL}/api/v1/search/web?q=${encodeURIComponent(query)}&count=10`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`搜索失败: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : '搜索失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType, projectDomain]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">联网搜索</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                搜索市场数据、竞品信息
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-white/50 dark:hover:bg-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Type Tabs */}
        <div className="flex space-x-2 mb-3">
          <button
            onClick={() => setSearchType('web')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              searchType === 'web'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-600'
            }`}
          >
            网页搜索
          </button>
          <button
            onClick={() => setSearchType('market')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              searchType === 'market'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-slate-600'
            }`}
          >
            市场分析
          </button>
        </div>

        {/* Search Input */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchType === 'market' ? '输入要研究的主题...' : '输入搜索关键词...'}
              className="w-full px-4 py-2 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 mb-4">
            <p className="text-sm">{error}</p>
            <button
              onClick={handleSearch}
              className="mt-2 text-sm flex items-center text-red-600 dark:text-red-400 hover:underline"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              重试
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">搜索中...</p>
          </div>
        )}

        {!isLoading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
            <Globe className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">输入关键词开始搜索</p>
            <p className="text-xs mt-1">支持中英文搜索</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              找到 {results.length} 条结果
            </p>
            {results.map((result, index) => (
              <a
                key={index}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 group-hover:text-green-600 dark:group-hover:text-green-400">
                    {result.title}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                  {result.description}
                </p>
                <div className="flex items-center mt-2 text-xs text-slate-400">
                  <span className="truncate max-w-[200px]">{result.url}</span>
                  {result.age && (
                    <span className="ml-2 flex-shrink-0">· {result.age}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          搜索结果来自 BraveSearch
        </p>
      </div>
    </div>
  );
}

export default SearchPanel;
