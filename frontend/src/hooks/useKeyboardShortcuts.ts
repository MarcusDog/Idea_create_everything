import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape key to work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common shortcuts for tree editor
export function useTreeEditorShortcuts({
  onSave,
  onUndo,
  onRedo,
  onAddNode,
  onDeleteNode,
  onFitView,
  onToggleChat,
  onToggleSearch,
  enabled = true,
}: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddNode?: () => void;
  onDeleteNode?: () => void;
  onFitView?: () => void;
  onToggleChat?: () => void;
  onToggleSearch?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrl: true,
      action: onSave,
      description: '保存项目',
    });
  }

  if (onUndo) {
    shortcuts.push({
      key: 'z',
      ctrl: true,
      action: onUndo,
      description: '撤销',
    });
  }

  if (onRedo) {
    shortcuts.push({
      key: 'y',
      ctrl: true,
      action: onRedo,
      description: '重做',
    });
    shortcuts.push({
      key: 'z',
      ctrl: true,
      shift: true,
      action: onRedo,
      description: '重做',
    });
  }

  if (onAddNode) {
    shortcuts.push({
      key: 'n',
      ctrl: true,
      action: onAddNode,
      description: '新建节点',
    });
  }

  if (onDeleteNode) {
    shortcuts.push({
      key: 'Delete',
      action: onDeleteNode,
      description: '删除节点',
    });
    shortcuts.push({
      key: 'Backspace',
      action: onDeleteNode,
      description: '删除节点',
    });
  }

  if (onFitView) {
    shortcuts.push({
      key: '0',
      ctrl: true,
      action: onFitView,
      description: '适应视图',
    });
  }

  if (onToggleChat) {
    shortcuts.push({
      key: '/',
      ctrl: true,
      action: onToggleChat,
      description: '切换AI助手',
    });
  }

  if (onToggleSearch) {
    shortcuts.push({
      key: 'k',
      ctrl: true,
      action: onToggleSearch,
      description: '切换搜索',
    });
  }

  useKeyboardShortcuts(shortcuts, enabled);

  return shortcuts;
}

export default useKeyboardShortcuts;
