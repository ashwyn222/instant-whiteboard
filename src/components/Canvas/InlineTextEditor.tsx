import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { BoxShape, Camera, Shape } from '../../store/types';
import { isBoxShape } from '../../store/types';
import styles from './InlineTextEditor.module.css';

const PADDING = 10;

function findShape(shapes: Shape[], id: string): Shape | undefined {
  return shapes.find((s) => s.id === id);
}

export function InlineTextEditor() {
  const editingId = useBoardStore((s) => s.editingTextId);
  const shapes = useBoardStore((s) => s.shapes);
  const camera = useBoardStore((s) => s.camera);
  const updateShape = useBoardStore((s) => s.updateShape);
  const setEditingText = useBoardStore((s) => s.setEditingText);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState('');

  const shape = editingId ? findShape(shapes, editingId) : null;

  useEffect(() => {
    if (shape && (isBoxShape(shape) || shape.type === 'text')) {
      const initial = 'text' in shape ? (shape.text ?? '') : '';
      setValue(initial);
      requestAnimationFrame(() => {
        taRef.current?.focus();
        taRef.current?.select();
      });
    }
  }, [shape]);

  if (!shape) return null;
  if (!isBoxShape(shape) && shape.type !== 'text') return null;

  const commit = () => {
    if (shape.type === 'text') {
      if (value.trim()) {
        updateShape(shape.id, { text: value });
      }
    } else {
      updateShape(shape.id, { text: value });
    }
    setEditingText(null);
  };

  const cancel = () => setEditingText(null);

  return (
    <textarea
      ref={taRef}
      className={styles.editor}
      style={editorStyle(shape, camera)}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
}

function editorStyle(shape: BoxShape | Shape, camera: Camera): React.CSSProperties {
  if ('width' in shape && 'height' in shape) {
    const box = shape as BoxShape;
    const screenX = box.x * camera.scale + camera.x;
    const screenY = box.y * camera.scale + camera.y;
    const width = Math.abs(box.width) * camera.scale;
    const height = Math.abs(box.height) * camera.scale;
    const fontSize = (box.fontSize ?? 14) * camera.scale;
    return {
      left: screenX + PADDING,
      top: screenY + PADDING,
      width: Math.max(40, width - PADDING * 2),
      height: Math.max(20, height - PADDING * 2),
      fontSize,
      lineHeight: 1.3,
    };
  }
  if (shape.type === 'text') {
    const screenX = shape.x * camera.scale + camera.x;
    const screenY = shape.y * camera.scale + camera.y;
    const fontSize = shape.fontSize * camera.scale;
    return {
      left: screenX,
      top: screenY,
      minWidth: 80,
      fontSize,
      lineHeight: 1.2,
      textAlign: 'left',
    };
  }
  return {};
}
