import { create } from 'zustand';
import type { Camera, Shape } from './types';

const HISTORY_LIMIT = 100;

interface HistorySnapshot {
  shapes: Shape[];
  selectedIds: string[];
}

interface BoardState {
  tool: Tool;
  shapes: Shape[];
  selectedIds: string[];
  camera: Camera;
  editingTextId: string | null;

  past: HistorySnapshot[];
  future: HistorySnapshot[];

  setTool: (tool: Tool) => void;
  setCamera: (camera: Camera) => void;

  addShape: (shape: Shape) => void;
  addShapes: (shapes: Shape[]) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  updateShapes: (patches: Array<{ id: string; patch: Partial<Shape> }>) => void;
  removeShape: (id: string) => void;
  removeShapes: (ids: string[]) => void;
  duplicateSelected: () => string[];

  setSelected: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelected: (id: string) => void;

  setEditingText: (id: string | null) => void;

  clear: () => void;
  undo: () => void;
  redo: () => void;

  hydrate: (state: { shapes: Shape[]; camera: Camera }) => void;
}

import type { Tool } from './types';

function snapshot(state: BoardState): HistorySnapshot {
  return { shapes: state.shapes, selectedIds: state.selectedIds };
}

function pushHistory(state: BoardState): Pick<BoardState, 'past' | 'future'> {
  const past = [...state.past, snapshot(state)];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const useBoardStore = create<BoardState>((set) => ({
  tool: 'select',
  shapes: [],
  selectedIds: [],
  camera: { x: 0, y: 0, scale: 1 },
  editingTextId: null,

  past: [],
  future: [],

  setTool: (tool) =>
    set((state) => ({
      tool,
      selectedIds: tool === 'select' ? state.selectedIds : [],
      editingTextId: null,
    })),

  setCamera: (camera) => set({ camera }),

  addShape: (shape) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [...state.shapes, shape],
    })),

  addShapes: (shapes) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [...state.shapes, ...shapes],
    })),

  updateShape: (id, patch) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? ({ ...s, ...patch } as Shape) : s,
      ),
    })),

  updateShapes: (patches) =>
    set((state) => {
      const map = new Map(patches.map((p) => [p.id, p.patch] as const));
      return {
        shapes: state.shapes.map((s) => {
          const patch = map.get(s.id);
          return patch ? ({ ...s, ...patch } as Shape) : s;
        }),
      };
    }),

  removeShape: (id) =>
    set((state) => ({
      ...pushHistory(state),
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  removeShapes: (ids) =>
    set((state) => {
      const set = new Set(ids);
      return {
        ...pushHistory(state),
        shapes: state.shapes.filter((s) => !set.has(s.id)),
        selectedIds: state.selectedIds.filter((sid) => !set.has(sid)),
      };
    }),

  duplicateSelected: () => {
    let createdIds: string[] = [];
    set((state) => {
      if (state.selectedIds.length === 0) return state;
      const selected = state.shapes.filter((s) =>
        state.selectedIds.includes(s.id),
      );
      const offset = 16;
      const idMap = new Map<string, string>();
      const copies: Shape[] = selected.map((shape) => {
        const newId = genId();
        idMap.set(shape.id, newId);
        const copy: Shape = { ...shape, id: newId } as Shape;
        if ('x' in copy) copy.x = (copy.x as number) + offset;
        if ('y' in copy) copy.y = (copy.y as number) + offset;
        if ('points' in copy) {
          copy.points = (copy as { points: number[] }).points.map((p, i) =>
            i % 2 === 0 ? p + offset : p + offset,
          ) as typeof copy.points;
        }
        return copy;
      });
      createdIds = copies.map((c) => c.id);
      return {
        ...pushHistory(state),
        shapes: [...state.shapes, ...copies],
        selectedIds: createdIds,
      };
    });
    return createdIds;
  },

  setSelected: (id) => set({ selectedIds: id ? [id] : [] }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelected: (id) =>
    set((state) => {
      const exists = state.selectedIds.includes(id);
      return {
        selectedIds: exists
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id],
      };
    }),

  setEditingText: (id) => set({ editingTextId: id }),

  clear: () =>
    set((state) => ({
      ...pushHistory(state),
      shapes: [],
      selectedIds: [],
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future],
        shapes: previous.shapes,
        selectedIds: previous.selectedIds,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      return {
        past: [...state.past, snapshot(state)],
        future: state.future.slice(1),
        shapes: next.shapes,
        selectedIds: next.selectedIds,
      };
    }),

  hydrate: ({ shapes, camera }) => set({ shapes, camera }),
}));
