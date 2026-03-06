'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Brain, GitBranch, Download, Settings, Layout } from 'lucide-react';
import { ThemeToggle } from '@/components/theme';
import { TemplateSelector } from '@/components/templates';
import { projectsApi } from '@/lib/api/projects';
import { checkApiHealth } from '@/lib/api/client';

export default function Home() {
  const router = useRouter();
  const [ideaInput, setIdeaInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if backend is available
      let backendAvailable = false;
      try {
        await checkApiHealth();
        backendAvailable = true;
        setIsLocalMode(false);
      } catch {
        setIsLocalMode(true);
      }

      if (backendAvailable) {
        // Create project via API
        const project = await projectsApi.createProject({
          name: ideaInput.slice(0, 50) + (ideaInput.length > 50 ? '...' : ''),
          description: ideaInput,
          domain: 'general',
        });

        // Navigate to project editor
        router.push(`/projects/${project.id}`);
      } else {
        // Fallback to localStorage mode
        const projectId = `local-${Date.now()}`;
        const project = {
          id: projectId,
          name: ideaInput.slice(0, 50) + (ideaInput.length > 50 ? '...' : ''),
          description: ideaInput,
          domain: 'general',
          nodeCount: 1,
          updatedAt: new Date().toISOString(),
        };

        // Save to localStorage
        const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
        localStorage.setItem('projects', JSON.stringify([project, ...existingProjects]));

        // Create initial project data
        const projectData = {
          nodes: [
            {
              id: 'root',
              type: 'treeNode',
              position: { x: 400, y: 50 },
              data: {
                label: project.name,
                description: ideaInput,
                status: 'todo',
                isRoot: true,
              },
            },
          ],
          edges: [],
          title: project.name,
        };
        localStorage.setItem(`project-${projectId}`, JSON.stringify(projectData));

        // Navigate to project editor
        router.push(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('创建项目失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-purple-950 dark:to-indigo-950" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
        {/* 浮动光效 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* 头部导航 */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/50 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Idea Create Everything
              </span>
            </div>
            <nav className="flex items-center space-x-6">
              {isLocalMode && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  本地模式
                </span>
              )}
              <Link
                href="/projects"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <GitBranch className="w-5 h-5" />
                <span>我的项目</span>
              </Link>
              <Link
                href="/config"
                className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>API配置</span>
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero 区域 */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-6 border border-purple-200 dark:border-purple-700">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                AI驱动的项目规划工具
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent leading-tight">
              让想法绽放成
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                完整项目
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              描述你的想法，AI智能分析并生成专业项目结构
              <br />
              <span className="text-lg">从概念到执行计划，让每个创意都有清晰的路径</span>
            </p>
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-8 border border-blue-100 dark:border-blue-900/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  AI智能规划
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  基于Claude AI，自动分析想法并生成专业的多层级项目结构
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-8 border border-green-100 dark:border-green-900/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <GitBranch className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  树形可视化
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  以树形图展示项目结构，从根节点逐层展开，支持拖拽编辑
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-8 border border-purple-100 dark:border-purple-900/50 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  多格式导出
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  支持导出为Markdown、思维导图、JSON等多种专业格式
                </p>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* 模板按钮 */}
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600 hover:scale-105"
            >
              <Layout className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="font-medium">使用模板快速开始</span>
            </button>
          </div>

          {/* 输入区域 */}
          <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 p-8 md:p-10">
            {/* 装饰性元素 */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl opacity-20" />

            <form onSubmit={handleSubmit} className="relative">
              <label className="block text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                ✨ 描述你的创意想法
              </label>
              <textarea
                value={ideaInput}
                onChange={(e) => setIdeaInput(e.target.value)}
                placeholder="例如：我想开发一个AI驱动的化妆品推荐App，可以通过用户上传照片分析肤质，智能推荐适合的产品，并提供虚拟试妆功能..."
                className="w-full h-40 p-5 border-2 border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 transition-all resize-none bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-lg backdrop-blur-sm"
              />
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {ideaInput.length} / 2000 字符
                </span>
                <button
                  type="submit"
                  disabled={!ideaInput.trim() || isLoading}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                >
                  {/* 光效动画 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-lg">AI智能分析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg">开始创造</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 底部状态 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLocalMode ? '本地存储模式 - 数据仅保存在浏览器中' : '已连接后端服务'}
            </p>
          </div>
        </div>
      </div>

      {/* Template Selector Dialog */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
      />
    </main>
  );
}
