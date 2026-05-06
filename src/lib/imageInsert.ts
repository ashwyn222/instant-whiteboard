import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { dialogAlert } from '../store/dialogStore';
import type { ImageShape } from '../store/types';
import { uid } from './id';
import { getStage } from './stage';

const MAX_DIMENSION = 480;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function insertImageFromFile(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) {
    await dialogAlert({
      title: 'Unsupported file',
      message: 'Please select an image file (PNG, JPG, GIF, SVG, WEBP).',
    });
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    await dialogAlert({
      title: 'Image too large',
      message: 'Please choose an image smaller than 8 MB.',
    });
    return;
  }
  const dataUrl = await readAsDataURL(file);
  await insertImageFromDataUrl(dataUrl);
}

export async function insertImageFromDataUrl(src: string): Promise<void> {
  const dims = await loadDimensions(src);
  const { width, height } = fitWithin(dims.width, dims.height, MAX_DIMENSION);

  const center = viewportCenterWorld();
  const shape: ImageShape = {
    id: uid(),
    type: 'image',
    src,
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
    stroke: '#1c1917',
    strokeWidth: 0,
    fill: 'transparent',
  };

  const store = useBoardStore.getState();
  store.addShape(shape);
  store.setTool('select');
  store.setSelected(shape.id);
}

export async function pickImageFile(): Promise<void> {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  await new Promise<void>((resolve) => {
    input.addEventListener(
      'change',
      async () => {
        const file = input.files?.[0];
        if (file) await insertImageFromFile(file);
        resolve();
      },
      { once: true },
    );
    input.addEventListener('cancel', () => resolve(), { once: true });
    input.click();
  });
  input.remove();
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || img.width || MAX_DIMENSION,
        height: img.naturalHeight || img.height || MAX_DIMENSION,
      });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: width * scale, height: height * scale };
}

function viewportCenterWorld(): { x: number; y: number } {
  const stage = getStage();
  const { camera } = useBoardStore.getState();
  const w = stage?.width() ?? window.innerWidth;
  const h = stage?.height() ?? window.innerHeight;
  return {
    x: (w / 2 - camera.x) / camera.scale,
    y: (h / 2 - camera.y) / camera.scale,
  };
}

export function useImagePasteAndDrop(): void {
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void insertImageFromFile(file);
            return;
          }
        }
      }
    };

    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDrop = (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (imageFiles.length === 0) return;
      event.preventDefault();
      for (const file of imageFiles) {
        void insertImageFromFile(file);
      }
    };

    window.addEventListener('paste', onPaste);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);
}
