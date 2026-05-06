import type { Shape } from '../store/types';
import { useBoardStore } from '../store/boardStore';

let internalClipboard: Shape[] = [];

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function copySelection(): void {
  const { shapes, selectedIds } = useBoardStore.getState();
  if (selectedIds.length === 0) return;
  internalClipboard = shapes
    .filter((s) => selectedIds.includes(s.id))
    .map((s) => structuredClone(s));
}

export function pasteFromClipboard(): void {
  if (internalClipboard.length === 0) return;
  const offset = 16;
  const copies: Shape[] = internalClipboard.map((shape) => {
    const copy = structuredClone(shape);
    copy.id = genId();
    if ('x' in copy) (copy as { x: number }).x += offset;
    if ('y' in copy) (copy as { y: number }).y += offset;
    if ('points' in copy) {
      const points = (copy as { points: number[] }).points;
      (copy as { points: number[] }).points = points.map((p, i) =>
        i % 2 === 0 ? p + offset : p + offset,
      );
    }
    return copy;
  });
  const store = useBoardStore.getState();
  store.addShapes(copies);
  store.setSelectedIds(copies.map((c) => c.id));
}

export function hasClipboard(): boolean {
  return internalClipboard.length > 0;
}
