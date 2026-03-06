'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Code, Sparkles, Globe, Video, ChevronRight, Loader2 } from 'lucide-react';
import { projectTemplates, getTemplateById, flattenTemplateNodes } from '@/data/templates';
import { projectsApi } from '@/lib/api/projects';
import { nodesApi } from '@/lib/api/nodes';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  code: <Code className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
};

const colorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
  pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400',
  green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
  purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
};

export function TemplateSelector({ isOpen, onClose }: TemplateSelectorProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreateFromTemplate = async (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    setIsCreating(true);

    try {
      // Create project via API
      const project = await projectsApi.createProject({
        name: template.name,
        description: template.description,
        domain: template.domain,
      });

      // Flatten template nodes and create them
      const flatNodes = flattenTemplateNodes(template.nodes);

      // Build nodes for React Flow
      const flowNodes = flatNodes.map(({ node, parentId }, index) => {
        const level = parentId ? flatNodes.findIndex(n => n.node.id === parentId) : -1;
        const depth = parentId ? (level >= 0 ? 1 : 0) : 0;

        return {
          id: node.id,
          project_id: project.id,
          label: node.label,
          description: node.description,
          status: node.status,
          position_x: 400 + (index % 4) * 200,
          position_y: 50 + Math.floor(index / 4) * 150,
          parent_id: parentId || null,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Build edges
      const flowEdges = flatNodes
        .filter(({ parentId }) => parentId)
        .map(({ node, parentId }) => ({
          id: `e-${parentId}-${node.id}`,
          source_id: parentId!,
          target_id: node.id,
          label: null,
          created_at: new Date().toISOString(),
        }));

      // Save tree data
      await nodesApi.saveTree(project.id, {
        nodes: flowNodes,
        edges: flowEdges,
      } as any);

      // Navigate to project
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project from template:', error);

      // Fallback to localStorage
      const projectId = `local-${Date.now()}`;
      const flatNodes = flattenTemplateNodes(template.nodes);

      const flowNodes = flatNodes.map(({ node, parentId }, index) => ({
        id: node.id,
        type: 'treeNode',
        position: { x: 400 + (index % 4) * 200, y: 50 + Math.floor(index / 4) * 150 },
        data: {
          label: node.label,
          description: node.description,
          status: node.status,
          parentId,
        },
      }));

      const flowEdges = flatNodes
        .filter(({ parentId }) => parentId)
        .map(({ node, parentId }) => ({
          id: `e-${parentId}-${node.id}`,
          source: parentId!,
          target: node.id,
        }));

      // Save to localStorage
      const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
      localStorage.setItem('projects', JSON.stringify([
        {
          id: projectId,
          name: template.name,
          description: template.description,
          domain: template.domain,
          nodeCount: flowNodes.length,
          updatedAt: new Date().toISOString(),
        },
        ...existingProjects,
      ]));

      localStorage.setItem(`project-${projectId}`, JSON.stringify({
        nodes: flowNodes,
        edges: flowEdges,
        title: template.name,
      }));

      router.push(`/projects/${projectId}`);
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              选择项目模板
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              从预设模板快速创建项目结构
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedId === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colorMap[template.color]}`}>
                    {iconMap[template.icon]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {template.domain}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => selectedId && handleCreateFromTemplate(selectedId)}
            disabled={!selectedId || isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>创建中...</span>
              </>
            ) : (
              <>
                <span>使用模板</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateSelector;
