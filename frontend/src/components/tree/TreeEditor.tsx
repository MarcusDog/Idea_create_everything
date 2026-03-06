'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ZoomIn, ZoomOut, Maximize, Save, Download } from 'lucide-react';

import TreeNode from './TreeNode';
import { TreeToolbar } from './TreeToolbar';
import { NodeEditDialog } from './NodeEditDialog';

const nodeTypes = {
  treeNode: TreeNode as any,
};

interface TreeEditorProps {
  projectId?: string;
  initialNodes?: any[];
  initialEdges?: any[];
  onSave?: (nodes: any[], edges: any[]) => void;
  onExport?: () => void;
  autoSaveInterval?: number; // in milliseconds
}

export function TreeEditor({
  projectId,
  initialNodes = [],
  initialEdges = [],
  onSave,
  onExport,
  autoSaveInterval = 10000, // 10 seconds default
}: TreeEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (parentId?: string) => {
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'treeNode',
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: {
          label: '新节点',
          description: '点击编辑描述',
          status: 'todo',
          onAdd: () => handleAddNode(newNode.id),
          onDelete: () => handleDeleteNode(newNode.id),
          onEdit: () => handleEditNode(newNode),
        },
      };

      setNodes((nds) => [...nds, newNode]);

      if (parentId) {
        setEdges((eds) => [
          ...eds,
          { id: `e-${parentId}-${newNode.id}`, source: parentId, target: newNode.id },
        ]);
      }
    },
    [setNodes, setEdges]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const handleEditNode = useCallback((node: Node) => {
    setSelectedNode(node);
    setIsEditDialogOpen(true);
  }, []);

  const handleSaveNode = useCallback(
    (updatedData: { label: string; description: string; status: string }) => {
      if (!selectedNode) return;

      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  ...updatedData,
                },
              }
            : n
        )
      );
      setIsEditDialogOpen(false);
      setSelectedNode(null);
    },
    [selectedNode, setNodes]
  );

  const handleAutoLayout = useCallback(() => {
    // Simple auto-layout: arrange nodes in a tree structure
    const layoutNodes = [...nodes];
    const rootNode = layoutNodes.find((n) => !edges.some((e) => e.target === n.id));

    if (rootNode) {
      const arranged = new Set<string>();
      const arrangeNode = (nodeId: string, x: number, y: number, level: number) => {
        if (arranged.has(nodeId)) return;
        arranged.add(nodeId);

        const nodeIndex = layoutNodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex >= 0) {
          layoutNodes[nodeIndex] = {
            ...layoutNodes[nodeIndex],
            position: { x, y },
          };
        }

        const children = edges.filter((e) => e.source === nodeId);
        const childWidth = 250;
        const startX = x - (children.length * childWidth) / 2 + childWidth / 2;

        children.forEach((child, index) => {
          arrangeNode(child.target, startX + index * childWidth, y + 150, level + 1);
        });
      };

      arrangeNode(rootNode.id, 400, 50, 0);
      setNodes(layoutNodes);
      fitView({ padding: 0.2 });
    }
  }, [nodes, edges, setNodes, fitView]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [nodes, edges]);

  // Auto-save functionality
  useEffect(() => {
    if (!onSave || !hasUnsavedChanges) return;

    const timer = setInterval(() => {
      onSave(nodes, edges);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [nodes, edges, onSave, hasUnsavedChanges, autoSaveInterval]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && onSave) {
        onSave(nodes, edges);
      }
    };
  }, [hasUnsavedChanges, nodes, edges, onSave]);

  return (
    <div className="h-full w-full flex flex-col">
      <TreeToolbar
        onAddNode={() => handleAddNode()}
        onAutoLayout={handleAutoLayout}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitView={() => fitView({ padding: 0.2 })}
        onSave={() => {
          onSave?.(nodes, edges);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        }}
        onExport={onExport}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#e2e8f0" gap={20} size={1} />
          <Controls className="bg-white border border-slate-200 shadow-md" />
          <MiniMap
            className="bg-white border border-slate-200 shadow-md rounded-lg"
            nodeColor={(node) => {
              switch (node.data?.status) {
                case 'done':
                  return '#22c55e';
                case 'in_progress':
                  return '#3b82f6';
                case 'blocked':
                  return '#ef4444';
                default:
                  return '#94a3b8';
              }
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />

          <Panel position="bottom-left" className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span>待办</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>进行中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>已完成</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>阻塞</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <NodeEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleSaveNode}
        node={selectedNode}
      />
    </div>
  );
}
