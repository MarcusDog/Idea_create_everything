'use client';

import { use, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Save,
  Download,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Grid3X3,
  Search,
  MessageSquare,
  Globe,
  ChevronLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

import TreeNodeComponent from '@/components/tree/TreeNode';
import { AIChatPanel } from '@/components/chat';
import { SearchPanel } from '@/components/search';
import { ExportDialog } from '@/components/export';
import { useTreeEditorShortcuts } from '@/hooks';
import { projectsApi } from '@/lib/api/projects';
import { nodesApi, type TreeNode as ApiTreeNode, type TreeEdge as ApiTreeEdge } from '@/lib/api/nodes';

const nodeTypes = {
  treeNode: TreeNodeComponent,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ProjectData {
  nodes: Node[];
  edges: Edge[];
  title: string;
}

// Transform API node to React Flow node
const apiNodeToFlowNode = (apiNode: ApiTreeNode): Node => ({
  id: apiNode.id,
  type: 'treeNode',
  position: { x: apiNode.position_x, y: apiNode.position_y },
  data: {
    label: apiNode.label,
    description: apiNode.description,
    status: apiNode.status,
    isRoot: !apiNode.parent_id,
  },
});

// Transform API edge to React Flow edge
const apiEdgeToFlowEdge = (apiEdge: ApiTreeEdge): Edge => ({
  id: apiEdge.id,
  source: apiEdge.source_id,
  target: apiEdge.target_id,
  label: apiEdge.label || undefined,
  type: 'smoothstep',
  animated: true,
});

function ProjectEditorContent({ id }: { id: string }) {
  const router = useRouter();

  // UI State
  const [projectTitle, setProjectTitle] = useState('项目规划');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelContent, setRightPanelContent] = useState<'chat' | 'search'>('chat');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Tree State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  // History for undo/redo
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load project data from API
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load project info
        const project = await projectsApi.getProject(id);
        setProjectTitle(project.name);

        // Load tree data
        try {
          const treeData = await nodesApi.getTree(id);
          if (treeData.nodes && treeData.nodes.length > 0) {
            const flowNodes = treeData.nodes.map(apiNodeToFlowNode);
            const flowEdges = treeData.edges.map(apiEdgeToFlowEdge);
            setNodes(flowNodes);
            setEdges(flowEdges);

            // Initialize history
            setHistory([{ nodes: flowNodes, edges: flowEdges }]);
            setHistoryIndex(0);
          } else {
            // Create initial root node
            const rootNode: Node = {
              id: 'root',
              type: 'treeNode',
              position: { x: 400, y: 100 },
              data: {
                label: project.name || '项目根节点',
                description: '这是项目的起点，点击添加子节点开始规划',
                status: 'todo',
                isRoot: true,
              },
            };
            setNodes([rootNode]);
            setEdges([]);
            setHistory([{ nodes: [rootNode], edges: [] }]);
            setHistoryIndex(0);
          }
        } catch (treeErr) {
          console.warn('Tree API not available, using localStorage:', treeErr);
          setError('后端未连接，使用本地模式');

          // Fallback to localStorage
          const savedData = localStorage.getItem(`project-${id}`);
          if (savedData) {
            const data: ProjectData = JSON.parse(savedData);
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            setHistory([{ nodes: data.nodes || [], edges: data.edges || [] }]);
            setHistoryIndex(0);
          } else {
            // Create initial root node
            const rootNode: Node = {
              id: 'root',
              type: 'treeNode',
              position: { x: 400, y: 100 },
              data: {
                label: project.name || '项目根节点',
                description: '这是项目的起点，点击添加子节点开始规划',
                status: 'todo',
                isRoot: true,
              },
            };
            setNodes([rootNode]);
            setEdges([]);
            setHistory([{ nodes: [rootNode], edges: [] }]);
            setHistoryIndex(0);
          }
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('无法连接到服务器（本地模式）');

        // Fallback to localStorage
        const saved = localStorage.getItem('projects');
        if (saved) {
          const projects = JSON.parse(saved);
          const project = projects.find((p: any) => p.id === id);
          if (project) {
            setProjectTitle(project.title || '项目规划');
          }
        }

        const savedData = localStorage.getItem(`project-${id}`);
        if (savedData) {
          const data: ProjectData = JSON.parse(savedData);
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
          setHistory([{ nodes: data.nodes || [], edges: data.edges || [] }]);
          setHistoryIndex(0);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [id, setNodes, setEdges]);

  // Auto-save to localStorage and API
  useEffect(() => {
    if (nodes.length > 0 && !isLoading) {
      const timer = setTimeout(async () => {
        const data: ProjectData = {
          nodes,
          edges,
          title: projectTitle,
        };
        localStorage.setItem(`project-${id}`, JSON.stringify(data));

        // Try to save to API
        if (!error) {
          try {
            const treeData = {
              nodes: nodes.map((n) => ({
                id: n.id,
                project_id: id,
                label: n.data.label || '未命名',
                description: n.data.description || null,
                status: n.data.status || 'todo',
                position_x: n.position.x,
                position_y: n.position.y,
                parent_id: n.data.parentId || null,
                metadata: n.data.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })),
              edges: edges.map((e) => ({
                id: e.id,
                source_id: e.source,
                target_id: e.target,
                label: e.label?.toString() || null,
                created_at: new Date().toISOString(),
              })),
            };

            await nodesApi.saveTree(id, treeData as any);
          } catch (err) {
            console.warn('Auto-save to API failed, using localStorage only');
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [id, projectTitle, nodes, edges, isLoading, error]);

  // Manual save handler
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const treeData = {
        nodes: nodes.map((n) => ({
          id: n.id,
          project_id: id,
          label: n.data.label || '未命名',
          description: n.data.description || null,
          status: n.data.status || 'todo',
          position_x: n.position.x,
          position_y: n.position.y,
          parent_id: n.data.parentId || null,
          metadata: n.data.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source_id: e.source,
          target_id: e.target,
          label: e.label?.toString() || null,
          created_at: new Date().toISOString(),
        })),
      };

      await nodesApi.saveTree(id, treeData as any);
      await projectsApi.updateProject(id, {
        tree_data: { nodes, edges },
      });

      setSaveMessage('✓ 保存成功');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      console.warn('API save failed, using localStorage');
      const data: ProjectData = { nodes, edges, title: projectTitle };
      localStorage.setItem(`project-${id}`, JSON.stringify(data));
      setSaveMessage('✓ 已保存到本地');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [id, nodes, edges, projectTitle]);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    if (newHistory.length > 50) newHistory.shift(); // Limit history size
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Add node
  const handleAddNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'treeNode',
      position: {
        x: Math.random() * 400 + 200,
        y: Math.random() * 300 + 150,
      },
      data: {
        label: '新节点',
        description: '点击编辑描述',
        status: 'todo',
        isRoot: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    saveToHistory();
  }, [setNodes, saveToHistory]);

  // Delete selected nodes
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((n) => !selectedNodes.includes(n.id)));
      setEdges((eds) =>
        eds.filter(
          (e) => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)
        )
      );
      setSelectedNodes([]);
      saveToHistory();
    }
  }, [selectedNodes, setNodes, setEdges, saveToHistory]);

  // Auto layout with tree algorithm
  const handleAutoLayout = useCallback(() => {
    const layoutNodes = [...nodes];

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = layoutNodes.filter(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    // Build adjacency list
    const children: Record<string, string[]> = {};
    edges.forEach((edge) => {
      if (!children[edge.source]) children[edge.source] = [];
      children[edge.source].push(edge.target);
    });

    // Layout parameters
    const horizontalGap = 350;
    const verticalGap = 150;
    let yOffset = 100;

    // BFS layout
    const visited = new Set<string>();
    const queue: Array<{ id: string; x: number; level: number }> = [];

    // Start with root nodes
    rootNodes.forEach((node, index) => {
      const x = index * horizontalGap + 100;
      queue.push({ id: node.id, x, level: 0 });
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      // Position current node
      const node = layoutNodes.find((n) => n.id === current.id);
      if (node) {
        node.position = {
          x: current.x,
          y: yOffset + current.level * verticalGap,
        };
      }

      // Add children to queue
      const nodeChildren = children[current.id] || [];
      nodeChildren.forEach((childId, index) => {
        const childX = current.x + (index - (nodeChildren.length - 1) / 2) * (horizontalGap / 2);
        queue.push({ id: childId, x: childX, level: current.level + 1 });
      });
    }

    setNodes(layoutNodes);
    saveToHistory();
  }, [nodes, edges, setNodes, saveToHistory]);

  // Handle edge connection
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true }, eds));
      saveToHistory();
    },
    [setEdges, saveToHistory]
  );

  // Stats
  const stats = useMemo(() => {
    const todoCount = nodes.filter((n) => n.data.status === 'todo').length;
    const doingCount = nodes.filter((n) => n.data.status === 'doing').length;
    const doneCount = nodes.filter((n) => n.data.status === 'done').length;
    return { total: nodes.length, todo: todoCount, doing: doingCount, done: doneCount };
  }, [nodes]);

  // Keyboard shortcuts
  useTreeEditorShortcuts({
    onSave: handleSave,
    onToggleChat: () => {
      setRightPanelContent('chat');
      setShowRightPanel((prev) => !prev || rightPanelContent !== 'chat');
    },
    onToggleSearch: () => {
      setRightPanelContent('search');
      setShowRightPanel((prev) => !prev || rightPanelContent !== 'search');
    },
    enabled: !isLoading,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full" />
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <div className="text-slate-600 dark:text-slate-400 font-medium">加载项目中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Toolbar */}
      <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0 z-10">
        <button
          onClick={() => router.push('/projects')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="返回项目列表"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:outline-none dark:text-white w-full max-w-md"
            placeholder="项目名称"
          />
          {error && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
          {saveMessage && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              {saveMessage}
            </span>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="重做 (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={handleAddNode}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-sm hover:shadow"
            title="添加节点 (Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline font-medium">新建</span>
          </button>

          <button
            onClick={handleAutoLayout}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="自动布局"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            title="手动保存"
          >
            <Save className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowExportDialog(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="导出"
          >
            <Download className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

          <button
            onClick={() => {
              setRightPanelContent('search');
              setShowRightPanel(!showRightPanel || rightPanelContent !== 'search');
            }}
            className={`p-2 rounded-lg transition-colors ${
              showRightPanel && rightPanelContent === 'search'
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="搜索"
          >
            <Globe className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setRightPanelContent('chat');
              setShowRightPanel(!showRightPanel || rightPanelContent !== 'chat');
            }}
            className={`p-2 rounded-lg transition-colors ${
              showRightPanel && rightPanelContent === 'chat'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title="AI助手"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {showLeftPanel && (
          <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">项目概览</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                实时统计和快捷操作
              </p>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats.total}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    总节点
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.doing}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    进行中
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">
                    {stats.todo}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    待办
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.done}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    已完成
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  快捷操作
                </h4>
                <button
                  onClick={handleAddNode}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium group"
                >
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>添加节点</span>
                </button>
                <button
                  onClick={handleAutoLayout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium group"
                >
                  <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                    <Grid3X3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>自动布局</span>
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedNodes.length === 0}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span>删除选中 ({selectedNodes.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-900">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50 dark:bg-slate-900"
            onSelectionChange={(params) => {
              setSelectedNodes(params.nodes.map((n) => n.id));
            }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { strokeWidth: 2 },
            }}
          >
            <Background
              color="#94a3b8"
              gap={20}
              size={1}
              className="dark:opacity-20"
            />
            <Controls className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg" />
            <MiniMap
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
              maskColor="rgba(0, 0, 0, 0.1)"
              nodeStrokeWidth={3}
            />

            <Panel
              position="bottom-left"
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 m-4 text-sm shadow-lg"
            >
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  {stats.total} 节点
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full" />
                  {edges.length} 连接
                </span>
                {selectedNodes.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                      选中 {selectedNodes.length}
                    </span>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Panel */}
        {showRightPanel && (
          <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col">
            {rightPanelContent === 'chat' ? (
              <AIChatPanel
                projectId={id}
                projectTitle={projectTitle}
                onAIResponse={(response) => console.log('AI:', response)}
              />
            ) : (
              <SearchPanel
                projectDomain={projectTitle}
                onClose={() => setShowRightPanel(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          projectId={id}
          projectTitle={projectTitle}
          nodes={nodes}
          edges={edges}
        />
      )}
    </div>
  );
}

export default function ProjectEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return (
    <ReactFlowProvider>
      <ProjectEditorContent id={id} />
    </ReactFlowProvider>
  );
}
