import { useEffect, useState } from 'react';
import {
  Arrow,
  Ellipse,
  Group,
  Image as KonvaImage,
  Line,
  Rect,
  Star,
  Text,
} from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { BoxShape, ImageShape, Shape, StrokeStyle } from '../../store/types';
import { connectorPoints } from '../../lib/geometry';

const TEXT_PADDING = 12;

function dashFor(style: StrokeStyle | undefined, strokeWidth: number) {
  if (style === 'dashed') return [strokeWidth * 4, strokeWidth * 3];
  if (style === 'dotted') return [strokeWidth * 0.5, strokeWidth * 2];
  return undefined;
}

interface ShapeViewProps {
  shape: Shape;
  draggable: boolean;
  onSelect: (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>,
  ) => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onDoubleClick: (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>,
  ) => void;
  onTransformEnd?: (e: KonvaEventObject<Event>) => void;
  isHidden?: boolean;
}

export function ShapeView({
  shape,
  draggable,
  onSelect,
  onDragMove,
  onDragEnd,
  onDoubleClick,
  onTransformEnd,
  isHidden,
}: ShapeViewProps) {
  const dash = dashFor(shape.strokeStyle, shape.strokeWidth);
  const visible = !isHidden;

  const common = {
    id: shape.id,
    draggable,
    onClick: onSelect as (e: KonvaEventObject<MouseEvent>) => void,
    onTap: onSelect as (e: KonvaEventObject<TouchEvent>) => void,
    onDblClick: onDoubleClick as (e: KonvaEventObject<MouseEvent>) => void,
    onDblTap: onDoubleClick as (e: KonvaEventObject<TouchEvent>) => void,
    onDragMove,
    onDragEnd,
    onTransformEnd,
    visible,
  };

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
    return (
      <BoxShapeView
        {...common}
        shape={shape}
        dash={dash}
      />
    );
  }

  if (shape.type === 'line') {
    return (
      <Line
        {...common}
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        dash={dash}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={12}
      />
    );
  }

  if (shape.type === 'arrow') {
    return (
      <Arrow
        {...common}
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.stroke}
        dash={dash}
        pointerLength={10}
        pointerWidth={10}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={12}
      />
    );
  }

  if (shape.type === 'connector') {
    return (
      <Arrow
        {...common}
        points={connectorPoints(shape.points)}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        fill={shape.stroke}
        dash={dash}
        pointerLength={10}
        pointerWidth={10}
        lineCap="square"
        lineJoin="miter"
        hitStrokeWidth={12}
      />
    );
  }

  if (shape.type === 'pen') {
    return (
      <Line
        {...common}
        points={shape.points}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        dash={dash}
        tension={0.4}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={12}
      />
    );
  }

  if (shape.type === 'text') {
    return (
      <Text
        {...common}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily="Inter, system-ui, sans-serif"
        fill={shape.fill || shape.stroke}
      />
    );
  }

  return null;
}

interface BoxShapeViewProps {
  shape: BoxShape;
  draggable: boolean;
  onClick: (e: KonvaEventObject<MouseEvent>) => void;
  onTap: (e: KonvaEventObject<TouchEvent>) => void;
  onDblClick: (e: KonvaEventObject<MouseEvent>) => void;
  onDblTap: (e: KonvaEventObject<TouchEvent>) => void;
  onDragMove: (e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: KonvaEventObject<Event>) => void;
  visible: boolean;
  id: string;
  dash: number[] | undefined;
}

function BoxShapeView({ shape, dash, ...rest }: BoxShapeViewProps) {
  const w = Math.abs(shape.width);
  const h = Math.abs(shape.height);
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;

  const strokeProps = {
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    fill: shape.fill,
    dash,
  };

  const fontSize = shape.fontSize ?? 14;

  return (
    <Group {...rest} x={cx} y={cy}>
      <BoxShapeBody shape={shape} strokeProps={strokeProps} w={w} h={h} />
      {shape.text && (
        <Text
          x={-w / 2 + TEXT_PADDING}
          y={-h / 2 + TEXT_PADDING}
          width={w - TEXT_PADDING * 2}
          height={h - TEXT_PADDING * 2}
          text={shape.text}
          fontSize={fontSize}
          fontFamily="Inter, system-ui, sans-serif"
          fill={shape.stroke}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      )}
    </Group>
  );
}

interface BoxBodyProps {
  shape: BoxShape;
  w: number;
  h: number;
  strokeProps: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    dash: number[] | undefined;
  };
}

function BoxShapeBody({ shape, w, h, strokeProps }: BoxBodyProps) {
  if (shape.type === 'rect') {
    return (
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        cornerRadius={4}
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'roundedRect') {
    const corner = Math.min(w, h) / 2;
    return (
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        cornerRadius={corner}
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'ellipse') {
    return <Ellipse radiusX={w / 2} radiusY={h / 2} {...strokeProps} />;
  }
  if (shape.type === 'triangle') {
    return (
      <Line
        points={[0, -h / 2, -w / 2, h / 2, w / 2, h / 2]}
        closed
        lineJoin="round"
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'diamond') {
    return (
      <Line
        points={[0, -h / 2, w / 2, 0, 0, h / 2, -w / 2, 0]}
        closed
        lineJoin="round"
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'parallelogram') {
    const skew = Math.min(w * 0.18, h * 0.4);
    return (
      <Line
        points={[
          -w / 2 + skew,
          -h / 2,
          w / 2,
          -h / 2,
          w / 2 - skew,
          h / 2,
          -w / 2,
          h / 2,
        ]}
        closed
        lineJoin="round"
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'hexagon') {
    const inset = Math.min(w * 0.22, h * 0.5);
    return (
      <Line
        points={[
          -w / 2 + inset,
          -h / 2,
          w / 2 - inset,
          -h / 2,
          w / 2,
          0,
          w / 2 - inset,
          h / 2,
          -w / 2 + inset,
          h / 2,
          -w / 2,
          0,
        ]}
        closed
        lineJoin="round"
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'cylinder') {
    const ellipseH = Math.min(h * 0.18, w * 0.35);
    return (
      <Cylinder w={w} h={h} ellipseH={ellipseH} strokeProps={strokeProps} />
    );
  }
  if (shape.type === 'star') {
    const outer = Math.max(w, h) / 2;
    const inner = outer * 0.45;
    return (
      <Star
        numPoints={5}
        innerRadius={inner}
        outerRadius={outer}
        lineJoin="round"
        {...strokeProps}
      />
    );
  }
  if (shape.type === 'image') {
    return <ImageBody shape={shape} w={w} h={h} strokeProps={strokeProps} />;
  }
  return null;
}

interface ImageBodyProps {
  shape: ImageShape;
  w: number;
  h: number;
  strokeProps: BoxBodyProps['strokeProps'];
}

function ImageBody({ shape, w, h, strokeProps }: ImageBodyProps) {
  const image = useLoadedImage(shape.src);
  const showStroke = shape.strokeWidth > 0;
  return (
    <>
      <KonvaImage
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        image={image ?? undefined}
        cornerRadius={4}
        fill={image ? undefined : '#f1f5f9'}
      />
      {showStroke && (
        <Rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          cornerRadius={4}
          stroke={strokeProps.stroke}
          strokeWidth={strokeProps.strokeWidth}
          dash={strokeProps.dash}
          listening={false}
        />
      )}
    </>
  );
}

function useLoadedImage(src: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled) setImg(image);
    };
    image.onerror = () => {
      if (!cancelled) setImg(null);
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return img;
}

interface CylinderProps {
  w: number;
  h: number;
  ellipseH: number;
  strokeProps: BoxBodyProps['strokeProps'];
}

function Cylinder({ w, h, ellipseH, strokeProps }: CylinderProps) {
  return (
    <Group>
      <Rect
        x={-w / 2}
        y={-h / 2 + ellipseH / 2}
        width={w}
        height={h - ellipseH}
        fill={strokeProps.fill}
        listening={false}
      />
      <Ellipse
        y={h / 2 - ellipseH / 2}
        radiusX={w / 2}
        radiusY={ellipseH / 2}
        {...strokeProps}
      />
      <Ellipse
        y={-h / 2 + ellipseH / 2}
        radiusX={w / 2}
        radiusY={ellipseH / 2}
        fill={strokeProps.fill}
        stroke={strokeProps.stroke}
        strokeWidth={strokeProps.strokeWidth}
        dash={strokeProps.dash}
      />
    </Group>
  );
}

export type { Konva };
