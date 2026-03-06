'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Node } from '@xyflow/react';

interface NodeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { label: string; description: string; status: string }) => void;
  node: Node | null;
}

const statuses = [
  { value: 'todo', label: '待办', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: '进行中', color: 'bg-blue-100 text-blue-700' },
  { value: 'done', label: '已完成', color: 'bg-green-100 text-green-700' },
  { value: 'blocked', label: '阻塞', color: 'bg-red-100 text-red-700' },
];

export function NodeEditDialog({ isOpen, onClose, onSave, node }: NodeEditDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');

  useEffect(() => {
    if (node) {
      const nodeData = node.data as { label?: string; description?: string; status?: string } | undefined;
      setLabel(nodeData?.label || '');
      setDescription(nodeData?.description || '');
      setStatus(nodeData?.status || 'todo');
    }
  }, [node]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({ label: label.trim(), description: description.trim(), status });
  };

  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">编辑节点</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              节点名称 *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入节点名称"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加详细描述..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              状态
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    status === s.value
                      ? s.color
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!label.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
