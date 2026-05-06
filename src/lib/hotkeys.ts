import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import type { Tool } from '../store/types';
import { copySelection, hasClipboard, pasteFromClipboard } from './clipboard';

const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  h: 'hand',
  r: 'rect',
  b: 'roundedRect',
  o: 'ellipse',
  g: 'triangle',
  d: 'diamond',
  i: 'parallelogram',
  x: 'hexagon',
  y: 'cylinder',
  s: 'star',
  l: 'line',
  a: 'arrow',
  c: 'connector',
  p: 'pen',
  t: 'text',
  e: 'eraser',
};

export function useHotkeys(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      const meta = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const store = useBoardStore.getState();

      if (meta && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        store.undo();
        return;
      }
      if ((meta && event.shiftKey && key === 'z') || (meta && key === 'y')) {
        event.preventDefault();
        store.redo();
        return;
      }

      if (meta && key === 'c' && store.selectedIds.length > 0) {
        event.preventDefault();
        copySelection();
        return;
      }
      if (meta && key === 'v') {
        if (hasClipboard()) {
          event.preventDefault();
          pasteFromClipboard();
        }
        return;
      }
      if (meta && key === 'd' && store.selectedIds.length > 0) {
        event.preventDefault();
        store.duplicateSelected();
        return;
      }
      if (meta && key === 'a') {
        event.preventDefault();
        store.setSelectedIds(store.shapes.map((s) => s.id));
        return;
      }

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        store.selectedIds.length > 0
      ) {
        event.preventDefault();
        store.removeShapes(store.selectedIds);
        return;
      }

      if (event.key === 'Escape') {
        store.setSelectedIds([]);
        store.setEditingText(null);
        return;
      }

      if (!meta && TOOL_KEYS[key]) {
        store.setTool(TOOL_KEYS[key]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
