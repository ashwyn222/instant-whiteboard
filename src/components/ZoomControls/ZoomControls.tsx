import { Minus, Plus, Maximize } from 'lucide-react';
import { useBoardStore } from '../../store/boardStore';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './ZoomControls.module.css';

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.2;

function zoomAroundCenter(
  camera: { x: number; y: number; scale: number },
  nextScale: number,
) {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const worldX = (cx - camera.x) / camera.scale;
  const worldY = (cy - camera.y) / camera.scale;
  return {
    scale: nextScale,
    x: cx - worldX * nextScale,
    y: cy - worldY * nextScale,
  };
}

export function ZoomControls() {
  const camera = useBoardStore((s) => s.camera);
  const setCamera = useBoardStore((s) => s.setCamera);

  const zoomIn = () => {
    const next = Math.min(MAX_SCALE, camera.scale * ZOOM_STEP);
    setCamera(zoomAroundCenter(camera, next));
  };
  const zoomOut = () => {
    const next = Math.max(MIN_SCALE, camera.scale / ZOOM_STEP);
    setCamera(zoomAroundCenter(camera, next));
  };
  const reset = () => setCamera({ x: 0, y: 0, scale: 1 });

  const percent = Math.round(camera.scale * 100);

  return (
    <div className={styles.controls} role="toolbar" aria-label="Zoom">
      <Tooltip label="Zoom out" side="top">
        <button
          type="button"
          className={styles.button}
          aria-label="Zoom out"
          disabled={camera.scale <= MIN_SCALE + 0.001}
          onClick={zoomOut}
        >
          <Minus size={16} strokeWidth={2} />
        </button>
      </Tooltip>
      <Tooltip label="Reset to 100%" side="top">
        <button
          type="button"
          className={styles.percent}
          aria-label={`Zoom ${percent}%. Click to reset.`}
          onClick={reset}
        >
          {percent}%
        </button>
      </Tooltip>
      <Tooltip label="Zoom in" side="top">
        <button
          type="button"
          className={styles.button}
          aria-label="Zoom in"
          disabled={camera.scale >= MAX_SCALE - 0.001}
          onClick={zoomIn}
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </Tooltip>
      <span className={styles.divider} aria-hidden />
      <Tooltip label="Reset view" side="top">
        <button
          type="button"
          className={styles.button}
          aria-label="Reset zoom and position"
          onClick={reset}
        >
          <Maximize size={15} strokeWidth={2} />
        </button>
      </Tooltip>
    </div>
  );
}
