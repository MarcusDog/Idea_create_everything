'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Plus, Trash2, Edit3, Circle, CheckCircle2, Clock, Ban, Sparkles } from 'lucide-react';

interface TreeNodeData {
  label: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  isRoot?: boolean;
  onAdd?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const statusConfig = {
  todo: {
    bg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700',
    border: 'border-slate-300 dark:border-slate-600',
    icon: Circle,
    iconColor: 'text-slate-400',
    badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    label: '待办',
  },
  doing: {
    bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50',
    border: 'border-blue-300 dark:border-blue-600',
    icon: Clock,
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    label: '进行中',
  },
  done: {
    bg: 'from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50',
    border: 'border-green-300 dark:border-green-600',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    label: '已完成',
  },
  blocked: {
    bg: 'from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50',
    border: 'border-red-300 dark:border-red-600',
    icon: Ban,
    iconColor: 'text-red-500',
    badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    label: '受阻',
  },
};

function TreeNodeComponent({ data, isConnectable }: NodeProps) {
  const nodeData = data as unknown as TreeNodeData;
  const status = nodeData.status || 'todo';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const isRootNode = nodeData.isRoot;

  return (
    <div className={`relative group min-w-[220px] max-w-[340px] transition-all duration-300 ${isRootNode ? 'scale-110' : ''}`}>
      {/* 连接点 - 顶部 */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-4 h-4 !-mt-2 !bg-gradient-to-br !from-purple-400 !to-blue-500 !border-3 !border-white dark:!border-slate-800 !rounded-full shadow-lg transition-all hover:scale-125"
      />

      {/* 节点主体 */}
      <div className={`relative rounded-2xl border-2 ${config.border} bg-gradient-to-br ${config.bg} backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group-hover:scale-105`}>
        {/* 光效背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* 根节点特殊装饰 */}
        {isRootNode && (
          <div className="absolute -top-1 -right-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-md opacity-75" />
              <Sparkles className="relative w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
          </div>
        )}

        <div className="relative p-5">
          {/* 头部 */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <StatusIcon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-slate-900 dark:text-white text-base leading-snug ${isRootNode ? 'text-lg' : ''}`} title={nodeData.label}>
                  {nodeData.label}
                </h3>
                {isRootNode && (
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3 h-3" />
                    项目根节点
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={nodeData.onEdit}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110"
                title="编辑节点"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {!isRootNode && (
                <button
                  onClick={nodeData.onDelete}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all hover:scale-110"
                  title="删除节点"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 描述 */}
          {nodeData.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 leading-relaxed" title={nodeData.description}>
              {nodeData.description}
            </p>
          )}

          {/* 状态标签 */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.badge} mb-3`}>
            <div className={`w-1.5 h-1.5 rounded-full ${config.iconColor.replace('text-', 'bg-')}`} />
            {config.label}
          </div>

          {/* 添加子节点按钮 */}
          <button
            onClick={nodeData.onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 bg-white/50 dark:bg-slate-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>添加子节点</span>
          </button>
        </div>
      </div>

      {/* 连接点 - 底部 */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-4 h-4 !-mb-2 !bg-gradient-to-br !from-blue-400 !to-purple-500 !border-3 !border-white dark:!border-slate-800 !rounded-full shadow-lg transition-all hover:scale-125"
      />
    </div>
  );
}

export default memo(TreeNodeComponent);
