'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Folder, Trash2, AlertCircle } from 'lucide-react';
import { projectsApi, type Project } from '@/lib/api/projects';

// Frontend Project interface (transformed from API)
interface ProjectView {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Transform API project to view model
  const transformProject = (p: Project): ProjectView => ({
    id: p.id,
    title: p.name,
    description: p.description || '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    nodeCount: p.tree_data?.nodes?.length || 0,
  });

  // Load projects from API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiProjects = await projectsApi.getProjects();
        setProjects(apiProjects.map(transformProject));
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('无法连接到服务器，请确保后端服务已启动');
        // Fallback to localStorage if API is unavailable
        const saved = localStorage.getItem('projects');
        if (saved) {
          setProjects(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;

    try {
      const newProject = await projectsApi.createProject({
        name: newProjectTitle,
        description: newProjectDescription,
        tree_data: { nodes: [], edges: [] },
      });

      const viewProject = transformProject(newProject);
      const updatedProjects = [viewProject, ...projects];
      setProjects(updatedProjects);
      
      // Also update localStorage as fallback
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      
      setNewProjectTitle('');
      setNewProjectDescription('');
      setShowNewProjectModal(false);
    } catch (err) {
      console.error('Failed to create project:', err);
      // Fallback to localStorage mode
      const viewProject: ProjectView = {
        id: Date.now().toString(),
        title: newProjectTitle,
        description: newProjectDescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodeCount: 0,
      };
      const updatedProjects = [viewProject, ...projects];
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
      setNewProjectTitle('');
      setNewProjectDescription('');
      setShowNewProjectModal(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectsApi.deleteProject(id);
      const updatedProjects = projects.filter((p) => p.id !== id);
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    } catch (err) {
      console.error('Failed to delete project:', err);
      // Still remove from local view
      const updatedProjects = projects.filter((p) => p.id !== id);
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                ← Idea Create Everything
              </Link>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>新建项目</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center text-yellow-800 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}（已切换到本地模式）</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">我的项目</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            管理你的所有项目想法，点击项目进入树形编辑器
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Folder className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              还没有项目
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">创建你的第一个项目想法吧</p>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <Link href={`/projects/${project.id}`}>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {project.title}
                  </h3>
                </Link>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                  {project.description || '暂无描述'}
                </p>

                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>{project.nodeCount} 个节点</span>
                  <span>
                    {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-2">
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除项目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-center rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    打开编辑器
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              新建项目
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  项目描述
                </label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="简要描述你的项目想法"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim()}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
