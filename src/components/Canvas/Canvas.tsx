import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Layer, Stage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useBoardStore } from '../../store/boardStore';
import { dialogPrompt } from '../../store/dialogStore';
import type {
  ArrowShape,
  Camera,
  ConnectorShape,
  CylinderShape,
  DiamondShape,
  EllipseShape,
  HexagonShape,
  LineShape,
  ParallelogramShape,
  PenShape,
  RectShape,
  RoundedRectShape,
  Shape,
  StarShape,
  TextShape,
  TriangleShape,
} from '../../store/types';
import { isBoxShape } from '../../store/types';
import { uid } from '../../lib/id';
import { shapeBBox } from '../../lib/geometry';
import { ShapeView } from './ShapeView';
import { InlineTextEditor } from './InlineTextEditor';
import { setStage } from '../../lib/stage';
import styles from './Canvas.module.css';

const STROKE = '#1c1917';
const STROKE_WIDTH = 2;
const FILL = 'transparent';

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;

function toWorld(point: { x: number; y: number }, camera: Camera) {
  return {
    x: (point.x - camera.x) / camera.scale,
    y: (point.y - camera.y) / camera.scale,
  };
}

interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragSnapshot {
  draggedId: string;
  positions: Map<string, { x: number; y: number }>;
}

export function Canvas() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const tool = useBoardStore((s) => s.tool);
  const shapes = useBoardStore((s) => s.shapes);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const camera = useBoardStore((s) => s.camera);
  const editingTextId = useBoardStore((s) => s.editingTextId);
  const setCamera = useBoardStore((s) => s.setCamera);
  const addShape = useBoardStore((s) => s.addShape);
  const updateShape = useBoardStore((s) => s.updateShape);
  const updateShapes = useBoardStore((s) => s.updateShapes);
  const removeShape = useBoardStore((s) => s.removeShape);
  const setSelected = useBoardStore((s) => s.setSelected);
  const setSelectedIds = useBoardStore((s) => s.setSelectedIds);
  const toggleSelected = useBoardStore((s) => s.toggleSelected);
  const setEditingText = useBoardStore((s) => s.setEditingText);
  const setTool = useBoardStore((s) => s.setTool);

  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [draft, setDraft] = useState<Shape | null>(null);
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<
    { x: number; y: number; cx: number; cy: number } | null
  >(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const dragSnapshot = useRef<DragSnapshot | null>(null);

  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    setStage(stage);
    const container = stage?.container();
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    container?.addEventListener('contextmenu', onContextMenu);
    return () => {
      container?.removeEventListener('contextmenu', onContextMenu);
      setStage(null);
    };
  }, []);

  const stageClass = useMemo(
    () => `${styles.stage} ${styles[`stage--${tool}`] ?? ''}`,
    [tool],
  );

  const shapeMap = useMemo(() => {
    const map = new Map<string, Shape>();
    for (const s of shapes) map.set(s.id, s);
    return map;
  }, [shapes]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    if (selectedIds.length === 0) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }
    const selectedShapes = selectedIds
      .map((id) => shapeMap.get(id))
      .filter((s): s is Shape => Boolean(s));
    const transformableIds = selectedShapes
      .filter(
        (s) =>
          s.type !== 'line' &&
          s.type !== 'arrow' &&
          s.type !== 'connector' &&
          s.type !== 'pen',
      )
      .map((s) => s.id);
    const nodes = transformableIds
      .map((id) => stage.findOne<Konva.Node>(`#${id}`))
      .filter((n): n is Konva.Node => Boolean(n));
    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, shapeMap]);

  const beginDraw = (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;
    const target = e.target;
    const isStage = target === stage;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const world = toWorld(pointer, camera);
    const evt = e.evt;
    const shiftKey = 'shiftKey' in evt && evt.shiftKey;

    if (tool === 'select') {
      if (isStage && !shiftKey) {
        setSelected(null);
        marqueeStart.current = pointer;
        setMarquee({ x: pointer.x, y: pointer.y, width: 0, height: 0 });
      }
      return;
    }

    const middleClick = 'button' in evt && (evt as MouseEvent).button === 1;
    if (tool === 'hand' || middleClick) {
      setIsPanning(true);
      panStart.current = {
        x: pointer.x,
        y: pointer.y,
        cx: camera.x,
        cy: camera.y,
      };
      return;
    }

    if (tool === 'eraser') {
      if (!isStage && target.id()) removeShape(target.id());
      return;
    }

    if (tool === 'text') {
      void (async () => {
        const value = await dialogPrompt({
          title: 'Add text',
          placeholder: 'Type something…',
          confirmLabel: 'Add',
        });
        if (!value) return;
        const shape: TextShape = {
          id: uid(),
          type: 'text',
          x: world.x,
          y: world.y,
          text: value,
          fontSize: 24,
          stroke: STROKE,
          strokeWidth: 0,
          fill: STROKE,
        };
        addShape(shape);
        setTool('select');
        setSelected(shape.id);
      })();
      return;
    }

    if (tool === 'arrow') {
      const shape: ArrowShape = {
        id: uid(),
        type: 'arrow',
        points: [world.x, world.y, world.x, world.y],
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: STROKE,
      };
      setDraft(shape);
      return;
    }

    if (tool === 'connector') {
      const shape: ConnectorShape = {
        id: uid(),
        type: 'connector',
        points: [world.x, world.y, world.x, world.y],
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: STROKE,
      };
      setDraft(shape);
      return;
    }

    if (tool === 'line') {
      const shape: LineShape = {
        id: uid(),
        type: 'line',
        points: [world.x, world.y, world.x, world.y],
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
      };
      setDraft(shape);
      return;
    }

    if (tool === 'pen') {
      const shape: PenShape = {
        id: uid(),
        type: 'pen',
        points: [world.x, world.y],
        stroke: STROKE,
        strokeWidth: STROKE_WIDTH,
        fill: 'transparent',
      };
      setDraft(shape);
      return;
    }

    const baseStyle = {
      stroke: STROKE,
      strokeWidth: STROKE_WIDTH,
      fill: FILL,
    };
    const baseBox = {
      id: uid(),
      x: world.x,
      y: world.y,
      width: 0,
      height: 0,
      ...baseStyle,
    };
    if (tool === 'rect') {
      setDraft({ ...baseBox, type: 'rect' } as RectShape);
      return;
    }
    if (tool === 'roundedRect') {
      setDraft({ ...baseBox, type: 'roundedRect' } as RoundedRectShape);
      return;
    }
    if (tool === 'ellipse') {
      setDraft({ ...baseBox, type: 'ellipse' } as EllipseShape);
      return;
    }
    if (tool === 'triangle') {
      setDraft({ ...baseBox, type: 'triangle' } as TriangleShape);
      return;
    }
    if (tool === 'diamond') {
      setDraft({ ...baseBox, type: 'diamond' } as DiamondShape);
      return;
    }
    if (tool === 'parallelogram') {
      setDraft({ ...baseBox, type: 'parallelogram' } as ParallelogramShape);
      return;
    }
    if (tool === 'hexagon') {
      setDraft({ ...baseBox, type: 'hexagon' } as HexagonShape);
      return;
    }
    if (tool === 'cylinder') {
      setDraft({ ...baseBox, type: 'cylinder' } as CylinderShape);
      return;
    }
    if (tool === 'star') {
      setDraft({ ...baseBox, type: 'star' } as StarShape);
      return;
    }
  };

  const continueDraw = (
    e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (isPanning && panStart.current) {
      setCamera({
        x: panStart.current.cx + (pointer.x - panStart.current.x),
        y: panStart.current.cy + (pointer.y - panStart.current.y),
        scale: camera.scale,
      });
      return;
    }

    if (marqueeStart.current) {
      const start = marqueeStart.current;
      setMarquee({
        x: Math.min(start.x, pointer.x),
        y: Math.min(start.y, pointer.y),
        width: Math.abs(pointer.x - start.x),
        height: Math.abs(pointer.y - start.y),
      });
      return;
    }

    const isMouseDragging =
      'buttons' in e.evt && (e.evt as MouseEvent).buttons === 1;
    const isTouching = 'touches' in e.evt && e.evt.touches.length > 0;
    if (tool === 'eraser' && (isMouseDragging || isTouching)) {
      const target = e.target;
      if (target !== stage && target.id()) removeShape(target.id());
      return;
    }

    if (!draft) return;
    const world = toWorld(pointer, camera);

    if (
      draft.type === 'rect' ||
      draft.type === 'roundedRect' ||
      draft.type === 'ellipse' ||
      draft.type === 'triangle' ||
      draft.type === 'diamond' ||
      draft.type === 'parallelogram' ||
      draft.type === 'hexagon' ||
      draft.type === 'cylinder' ||
      draft.type === 'star'
    ) {
      setDraft({
        ...draft,
        width: world.x - draft.x,
        height: world.y - draft.y,
      });
    } else if (
      draft.type === 'line' ||
      draft.type === 'arrow' ||
      draft.type === 'connector'
    ) {
      setDraft({
        ...draft,
        points: [draft.points[0], draft.points[1], world.x, world.y],
      });
    } else if (draft.type === 'pen') {
      setDraft({ ...draft, points: [...draft.points, world.x, world.y] });
    }
  };

  const endDraw = () => {
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
      return;
    }

    if (marqueeStart.current && marquee) {
      const w0 = toWorld({ x: marquee.x, y: marquee.y }, camera);
      const w1 = toWorld(
        { x: marquee.x + marquee.width, y: marquee.y + marquee.height },
        camera,
      );
      const xMin = Math.min(w0.x, w1.x);
      const yMin = Math.min(w0.y, w1.y);
      const xMax = Math.max(w0.x, w1.x);
      const yMax = Math.max(w0.y, w1.y);
      const sized = marquee.width > 4 || marquee.height > 4;
      if (sized) {
        const ids: string[] = [];
        for (const s of shapes) {
          const bbox = shapeBBox(s);
          if (bbox) {
            const sx = bbox.x;
            const sy = bbox.y;
            const sxx = bbox.x + Math.abs(bbox.width);
            const syy = bbox.y + Math.abs(bbox.height);
            if (sx >= xMin && sxx <= xMax && sy >= yMin && syy <= yMax) {
              ids.push(s.id);
            }
          } else if ('points' in s) {
            const pts = s.points;
            let inside = true;
            for (let i = 0; i < pts.length; i += 2) {
              const px = pts[i]!;
              const py = pts[i + 1]!;
              if (px < xMin || px > xMax || py < yMin || py > yMax) {
                inside = false;
                break;
              }
            }
            if (inside && pts.length > 0) ids.push(s.id);
          }
        }
        setSelectedIds(ids);
      }
      marqueeStart.current = null;
      setMarquee(null);
      return;
    }

    if (!draft) return;

    let committed = draft;
    if (
      committed.type === 'rect' ||
      committed.type === 'roundedRect' ||
      committed.type === 'ellipse' ||
      committed.type === 'triangle' ||
      committed.type === 'diamond' ||
      committed.type === 'parallelogram' ||
      committed.type === 'hexagon' ||
      committed.type === 'cylinder' ||
      committed.type === 'star'
    ) {
      let { x, y, width, height } = committed;
      if (width < 0) {
        x += width;
        width = Math.abs(width);
      }
      if (height < 0) {
        y += height;
        height = Math.abs(height);
      }
      if (width < 4 && height < 4) {
        const def = 80;
        width = def;
        height = def;
      }
      committed = { ...committed, x, y, width, height };
    }
    if (
      committed.type === 'line' ||
      committed.type === 'arrow' ||
      committed.type === 'connector'
    ) {
      const [x1, y1, x2, y2] = committed.points;
      if (Math.hypot(x2 - x1, y2 - y1) < 4) {
        setDraft(null);
        return;
      }
    }
    if (committed.type === 'pen' && committed.points.length < 4) {
      setDraft(null);
      return;
    }

    addShape(committed);
    setDraft(null);
    setTool('select');
    setSelected(committed.id);
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    if (e.evt.ctrlKey || e.evt.metaKey) {
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1 + direction * 0.08;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, camera.scale * factor),
      );
      const worldBefore = toWorld(pointer, camera);
      setCamera({
        scale: newScale,
        x: pointer.x - worldBefore.x * newScale,
        y: pointer.y - worldBefore.y * newScale,
      });
    } else {
      setCamera({
        ...camera,
        x: camera.x - e.evt.deltaX,
        y: camera.y - e.evt.deltaY,
      });
    }
  };

  const handleShapeSelect =
    (id: string) =>
    (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
      if (tool === 'eraser') {
        e.cancelBubble = true;
        removeShape(id);
        return;
      }
      if (tool !== 'select') return;
      e.cancelBubble = true;
      const evt = e.evt as MouseEvent | TouchEvent;
      const shiftKey = 'shiftKey' in evt && evt.shiftKey;
      if (shiftKey) toggleSelected(id);
      else setSelected(id);
    };

  const handleShapeDoubleClick =
    (id: string) =>
    (e: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>) => {
      const shape = shapeMap.get(id);
      if (!shape) return;
      if (!(isBoxShape(shape) || shape.type === 'text')) return;
      if (shape.type === 'image') return;
      e.cancelBubble = true;
      setSelected(id);
      setEditingText(id);
    };

  const handleShapeDragStart = (id: string) => {
    const positions = new Map<string, { x: number; y: number }>();
    const ids = selectedIds.includes(id) ? selectedIds : [id];
    for (const sid of ids) {
      const s = shapeMap.get(sid);
      if (!s) continue;
      if (isBoxShape(s)) positions.set(sid, { x: s.x, y: s.y });
      else if (s.type === 'text') positions.set(sid, { x: s.x, y: s.y });
    }
    dragSnapshot.current = { draggedId: id, positions };
  };

  const handleShapeDragMove =
    (id: string) => (e: KonvaEventObject<DragEvent>) => {
      const snap = dragSnapshot.current;
      if (!snap || snap.draggedId !== id) return;
      const node = e.target;
      const draggedShape = shapeMap.get(id);
      if (!draggedShape) return;
      const initial = snap.positions.get(id);
      if (!initial) return;

      const newCenter = { x: node.x(), y: node.y() };
      let dx = 0;
      let dy = 0;
      if (isBoxShape(draggedShape)) {
        dx = newCenter.x - draggedShape.width / 2 - initial.x;
        dy = newCenter.y - draggedShape.height / 2 - initial.y;
      } else if (draggedShape.type === 'text') {
        dx = newCenter.x - initial.x;
        dy = newCenter.y - initial.y;
      }

      if (selectedIds.length > 1 && selectedIds.includes(id)) {
        const patches: Array<{ id: string; patch: Partial<Shape> }> = [];
        snap.positions.forEach((pos, sid) => {
          if (sid === id) return;
          patches.push({ id: sid, patch: { x: pos.x + dx, y: pos.y + dy } });
        });
        if (patches.length) updateShapes(patches);
      } else {
        if (isBoxShape(draggedShape)) {
          updateShape(id, {
            x: initial.x + dx,
            y: initial.y + dy,
          });
        } else if (draggedShape.type === 'text') {
          updateShape(id, { x: initial.x + dx, y: initial.y + dy });
        }
      }
    };

  const handleShapeDragEnd =
    (id: string) => (e: KonvaEventObject<DragEvent>) => {
      const snap = dragSnapshot.current;
      const draggedShape = shapeMap.get(id);
      const node = e.target;
      if (!draggedShape) return;
      if (
        draggedShape.type === 'pen' ||
        draggedShape.type === 'line' ||
        draggedShape.type === 'arrow' ||
        draggedShape.type === 'connector'
      ) {
        const dx = node.x();
        const dy = node.y();
        const points = (draggedShape as { points: number[] }).points;
        const newPoints = points.map((p, i) =>
          i % 2 === 0 ? p + dx : p + dy,
        );
        updateShape(id, { points: newPoints } as Partial<Shape>);
        node.position({ x: 0, y: 0 });
      } else if (isBoxShape(draggedShape)) {
        const initial = snap?.positions.get(id);
        const dx = initial
          ? node.x() - draggedShape.width / 2 - initial.x
          : 0;
        const dy = initial
          ? node.y() - draggedShape.height / 2 - initial.y
          : 0;
        const finalX = initial ? initial.x + dx : node.x() - draggedShape.width / 2;
        const finalY = initial ? initial.y + dy : node.y() - draggedShape.height / 2;
        updateShape(id, { x: finalX, y: finalY });
      } else if (draggedShape.type === 'text') {
        updateShape(id, { x: node.x(), y: node.y() });
      }
      dragSnapshot.current = null;
    };

  const handleShapeTransformEnd =
    (id: string) => (e: KonvaEventObject<Event>) => {
      const node = e.target;
      const shape = shapeMap.get(id);
      if (!shape) return;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      if (isBoxShape(shape)) {
        const newWidth = Math.max(4, Math.abs(shape.width) * scaleX);
        const newHeight = Math.max(4, Math.abs(shape.height) * scaleY);
        const newCenterX = node.x();
        const newCenterY = node.y();
        updateShape(id, {
          x: newCenterX - newWidth / 2,
          y: newCenterY - newHeight / 2,
          width: newWidth,
          height: newHeight,
        });
        return;
      }

      if (shape.type === 'text') {
        const factor = (scaleX + scaleY) / 2;
        updateShape(id, {
          x: node.x(),
          y: node.y(),
          fontSize: Math.max(8, shape.fontSize * factor),
        });
      }
    };

  const renderEndpointHandles = () => {
    if (tool !== 'select') return null;
    if (selectedIds.length !== 1) return null;
    const id = selectedIds[0]!;
    const shape = shapeMap.get(id);
    if (!shape) return null;
    if (
      shape.type !== 'line' &&
      shape.type !== 'arrow' &&
      shape.type !== 'connector'
    )
      return null;

    const visible: [number, number, number, number] = shape.points;
    const handleSize = 6 / camera.scale;
    const strokePx = 1.5 / camera.scale;

    const onEndpointDrag =
      (which: 0 | 1) => (e: KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const pos = { x: node.x(), y: node.y() };
        const newPoints: [number, number, number, number] =
          which === 0
            ? [pos.x, pos.y, shape.points[2], shape.points[3]]
            : [shape.points[0], shape.points[1], pos.x, pos.y];
        updateShape(id, { points: newPoints } as Partial<
          LineShape | ArrowShape | ConnectorShape
        >);
      };

    return (
      <>
        <Circle
          x={visible[0]}
          y={visible[1]}
          radius={handleSize}
          fill="#ffffff"
          stroke="#cccccc"
          strokeWidth={strokePx}
          draggable
          onDragMove={onEndpointDrag(0)}
        />
        <Circle
          x={visible[2]}
          y={visible[3]}
          radius={handleSize}
          fill="#ffffff"
          stroke="#cccccc"
          strokeWidth={strokePx}
          draggable
          onDragMove={onEndpointDrag(1)}
        />
      </>
    );
  };

  return (
    <>
      <Stage
        ref={stageRef}
        className={stageClass}
        width={size.width}
        height={size.height}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        onMouseDown={beginDraw}
        onMouseMove={continueDraw}
        onMouseUp={endDraw}
        onTouchStart={beginDraw}
        onTouchMove={continueDraw}
        onTouchEnd={endDraw}
        onWheel={onWheel}
      >
        <Layer>
          {shapes.map((shape) => (
            <ShapeView
              key={shape.id}
              shape={shape}
              draggable={tool === 'select'}
              isHidden={editingTextId === shape.id}
              onSelect={handleShapeSelect(shape.id)}
              onDoubleClick={handleShapeDoubleClick(shape.id)}
              onDragMove={(e) => {
                if (!dragSnapshot.current) handleShapeDragStart(shape.id);
                handleShapeDragMove(shape.id)(e);
              }}
              onDragEnd={handleShapeDragEnd(shape.id)}
              onTransformEnd={handleShapeTransformEnd(shape.id)}
            />
          ))}
          {draft && (
            <ShapeView
              shape={draft}
              draggable={false}
              onSelect={() => {}}
              onDoubleClick={() => {}}
              onDragMove={() => {}}
              onDragEnd={() => {}}
            />
          )}
          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
            ]}
            anchorSize={12}
            anchorCornerRadius={6}
            anchorStroke="#cccccc"
            anchorStrokeWidth={1.25}
            anchorFill="#ffffff"
            borderStroke="#3b82f6"
            borderStrokeWidth={1.5}
            padding={0}
          />
          {renderEndpointHandles()}
        </Layer>
      </Stage>
      {marquee && (
        <div
          className={styles.marquee}
          style={{
            left: marquee.x,
            top: marquee.y,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
      <InlineTextEditor />
    </>
  );
}
