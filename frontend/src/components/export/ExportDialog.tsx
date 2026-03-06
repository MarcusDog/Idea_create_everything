'use client';

import { useState } from 'react';
import { X, FileJson, FileText, Image, Download, Loader2, Check } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  nodes: Node[];
  edges: Edge[];
}

type ExportFormat = 'json' | 'markdown' | 'png';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const exportOptions: ExportOption[] = [
  {
    format: 'json',
    label: 'JSON',
    description: '完整数据结构，可导入恢复',
    icon: <FileJson className="w-6 h-6" />,
  },
  {
    format: 'markdown',
    label: 'Markdown',
    description: '大纲格式，便于文档编辑',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    format: 'png',
    label: 'PNG 图片',
    description: '项目树结构截图',
    icon: <Image className="w-6 h-6" />,
  },
];

export function ExportDialog({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  nodes,
  edges,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      switch (selectedFormat) {
        case 'json':
          exportAsJson();
          break;
        case 'markdown':
          await exportAsMarkdown();
          break;
        case 'png':
          await exportAsPng();
          break;
      }
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJson = () => {
    const data = {
      project: {
        id: projectId,
        title: projectTitle,
        exportedAt: new Date().toISOString(),
      },
      nodes: nodes.map((n) => ({
        id: n.id,
        label: n.data?.label,
        description: n.data?.description,
        status: n.data?.status,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };

    downloadFile(
      JSON.stringify(data, null, 2),
      `${projectTitle || 'project'}-${Date.now()}.json`,
      'application/json'
    );
  };

  const exportAsMarkdown = async () => {
    // Build markdown from nodes
    const lines: string[] = [];
    lines.push(`# ${projectTitle || '项目'}`);
    lines.push('');
    lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('## 项目结构');
    lines.push('');

    // Build tree structure
    const nodeMap = new Map<string, Node>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // Find root nodes (nodes that are not targets of any edge)
    const targetIds = new Set(edges.map((e) => e.target));
    const rootNodes = nodes.filter((n) => !targetIds.has(n.id));

    // Build children map
    const childrenMap = new Map<string, string[]>();
    edges.forEach((e) => {
      const children = childrenMap.get(e.source) || [];
      children.push(e.target);
      childrenMap.set(e.source, children);
    });

    // Recursive function to build markdown
    const buildMd = (nodeId: string, level: number) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      const indent = '  '.repeat(level);
      const label = node.data?.label || '未命名';
      const description = node.data?.description;
      const status = String(node.data?.status || 'todo');

      const statusMap: Record<string, string> = {
        todo: '[ ]',
        doing: '[-]',
        done: '[x]',
        blocked: '[!]',
      };
      const statusIcon = statusMap[status] || '[ ]';

      lines.push(`${indent}- ${statusIcon} **${label}**`);
      if (description) {
        lines.push(`${indent}  - ${description}`);
      }

      // Process children
      const children = childrenMap.get(nodeId) || [];
      children.forEach((childId) => buildMd(childId, level + 1));
    };

    rootNodes.forEach((root) => buildMd(root.id, 0));

    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*由 Idea Create Everything 导出*');

    downloadFile(
      lines.join('\n'),
      `${projectTitle || 'project'}-${Date.now()}.md`,
      'text/markdown'
    );
  };

  const exportAsPng = async () => {
    // Find the React Flow viewport element
    const viewport = document.querySelector('.react-flow__viewport');
    if (!viewport) {
      throw new Error('无法找到项目视图');
    }

    // Use html-to-image library if available, or fallback to canvas
    try {
      // Dynamic import html-to-image
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(viewport as HTMLElement, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${projectTitle || 'project'}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG export error:', err);
      throw new Error('PNG导出失败，请确保已安装 html-to-image 库');
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">导出项目</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-slate-600 mb-4">
            选择导出格式
          </p>

          <div className="space-y-2">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => setSelectedFormat(option.format)}
                className={`w-full flex items-center p-4 rounded-xl border-2 transition-colors ${
                  selectedFormat === option.format
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedFormat === option.format
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {option.icon}
                </div>
                <div className="ml-3 text-left">
                  <p className="font-medium text-slate-900">{option.label}</p>
                  <p className="text-sm text-slate-500">{option.description}</p>
                </div>
                {selectedFormat === option.format && (
                  <div className="ml-auto">
                    <Check className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>导出中...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>导出成功</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>导出</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
