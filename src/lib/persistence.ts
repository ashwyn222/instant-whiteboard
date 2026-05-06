import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import type { Camera, Shape } from '../store/types';

const STORAGE_KEY = 'board';
const SAVE_DEBOUNCE = 400;

interface PersistedState {
  shapes: Shape[];
  camera: Camera;
}

const hasChromeStorage = (): boolean =>
  typeof chrome !== 'undefined' &&
  typeof chrome.storage !== 'undefined' &&
  typeof chrome.storage.local !== 'undefined';

async function load(): Promise<PersistedState | null> {
  if (!hasChromeStorage()) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  }
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return (data[STORAGE_KEY] as PersistedState | undefined) ?? null;
}

async function save(state: PersistedState): Promise<void> {
  if (!hasChromeStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return;
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export function usePersistence(): void {
  useEffect(() => {
    let cancelled = false;
    void load().then((persisted) => {
      if (cancelled || !persisted) return;
      useBoardStore.getState().hydrate(persisted);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timer: number | null = null;
    const unsubscribe = useBoardStore.subscribe((state) => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void save({ shapes: state.shapes, camera: state.camera });
      }, SAVE_DEBOUNCE);
    });
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
