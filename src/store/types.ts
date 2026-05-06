export type Tool =
  | 'select'
  | 'hand'
  | 'rect'
  | 'roundedRect'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'parallelogram'
  | 'hexagon'
  | 'cylinder'
  | 'star'
  | 'line'
  | 'arrow'
  | 'connector'
  | 'pen'
  | 'text'
  | 'eraser';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface ShapeBase {
  id: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle?: StrokeStyle;
  fill: string;
}

interface BoxShapeBase extends ShapeBase {
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
}

export interface RectShape extends BoxShapeBase {
  type: 'rect';
}

export interface RoundedRectShape extends BoxShapeBase {
  type: 'roundedRect';
}

export interface EllipseShape extends BoxShapeBase {
  type: 'ellipse';
}

export interface TriangleShape extends BoxShapeBase {
  type: 'triangle';
}

export interface DiamondShape extends BoxShapeBase {
  type: 'diamond';
}

export interface ParallelogramShape extends BoxShapeBase {
  type: 'parallelogram';
}

export interface HexagonShape extends BoxShapeBase {
  type: 'hexagon';
}

export interface CylinderShape extends BoxShapeBase {
  type: 'cylinder';
}

export interface StarShape extends BoxShapeBase {
  type: 'star';
}

export interface ImageShape extends BoxShapeBase {
  type: 'image';
  src: string;
}

export interface LineShape extends ShapeBase {
  type: 'line';
  points: [number, number, number, number];
}

export interface ArrowShape extends ShapeBase {
  type: 'arrow';
  points: [number, number, number, number];
}

export interface ConnectorShape extends ShapeBase {
  type: 'connector';
  points: [number, number, number, number];
}

export interface PenShape extends ShapeBase {
  type: 'pen';
  points: number[];
}

export interface TextShape extends ShapeBase {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type BoxShape =
  | RectShape
  | RoundedRectShape
  | EllipseShape
  | TriangleShape
  | DiamondShape
  | ParallelogramShape
  | HexagonShape
  | CylinderShape
  | StarShape
  | ImageShape;

export type Shape =
  | BoxShape
  | LineShape
  | ArrowShape
  | ConnectorShape
  | PenShape
  | TextShape;

export const BOX_SHAPE_TYPES: ReadonlyArray<BoxShape['type']> = [
  'rect',
  'roundedRect',
  'ellipse',
  'triangle',
  'diamond',
  'parallelogram',
  'hexagon',
  'cylinder',
  'star',
  'image',
];

export function isBoxShape(shape: Shape): shape is BoxShape {
  return (BOX_SHAPE_TYPES as ReadonlyArray<string>).includes(shape.type);
}
