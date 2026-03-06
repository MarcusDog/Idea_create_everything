'use client';

import { Plus, Layout, ZoomIn, ZoomOut, Maximize, Save, Download, Sparkles, CheckCircle } from 'lucide-react';

interface TreeToolbarProps {
  onAddNode: () => void;
  onAutoLayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onSave?: () => void;
  onExport?: () => void;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
}

export function TreeToolbar({
  onAddNode,
  onAutoLayout,
  onZoomIn,
  onZoomOut,
  onFitView,
  onSave,
  onExport,
  lastSaved,
  hasUnsavedChanges,
}: TreeToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2">
        <button
          onClick={onAddNode}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>添加节点</span>
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
        >
          <Layout className="w-4 h-4" />
          <span>自动布局</span>
        </button>

        <div className="h-6 w-px bg-slate-300 mx-2" />

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-white rounded-md transition-colors text-slate-600"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onFitView}
            className="p-2 hover:bg-white rounded-md transition-colors text-slate-600"
            title="适应视图"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-white rounded-md transition-colors text-slate-600"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Save Status */}
        {lastSaved && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            {hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>未保存</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span>
                  已保存 {lastSaved.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
        )}

        {onSave && (
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </button>
        )}

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-300 mx-2" />

        <button
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI 扩展</span>
        </button>
      </div>
    </div>
  );
}
