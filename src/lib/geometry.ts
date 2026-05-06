import type { Shape } from '../store/types';

export interface Point {
  x: number;
  y: number;
}

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function connectorPoints(
  endpoints: [number, number, number, number],
): number[] {
  const [x1, y1, x2, y2] = endpoints;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return [x1, y1, x2, y2];
  if (Math.abs(dx) >= Math.abs(dy)) {
    return [x1, y1, x2, y1, x2, y2];
  }
  return [x1, y1, x1, y2, x2, y2];
}

export function shapeBBox(shape: Shape): BBox | null {
  if (
    shape.type === 'rect' ||
    shape.type === 'roundedRect' ||
    shape.type === 'ellipse' ||
    shape.type === 'triangle' ||
    shape.type === 'diamond' ||
    shape.type === 'parallelogram' ||
    shape.type === 'hexagon' ||
    shape.type === 'cylinder' ||
    shape.type === 'star' ||
    shape.type === 'image'
  ) {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
    };
  }
  return null;
}

export function bboxCenter(bbox: BBox): Point {
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  };
}

