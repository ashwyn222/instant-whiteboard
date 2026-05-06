import { useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { Shape, StrokeStyle } from '../../store/types';
import styles from './StylePanel.module.css';

const STROKE_COLORS = [
  '#1c1917',
  '#78716c',
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#0284c7',
  '#7c3aed',
  '#db2777',
];

const FILL_COLORS = [
  'transparent',
  '#ffffff',
  '#f5f5f4',
  '#fee2e2',
  '#ffedd5',
  '#fef3c7',
  '#dcfce7',
  '#dbeafe',
  '#ede9fe',
];

const STYLES: { id: StrokeStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
];

export function StylePanel() {
  const shapes = useBoardStore((s) => s.shapes);
  const selectedIds = useBoardStore((s) => s.selectedIds);
  const updateShapes = useBoardStore((s) => s.updateShapes);

  const selected = useMemo(
    () => shapes.filter((s) => selectedIds.includes(s.id)),
    [shapes, selectedIds],
  );

  if (selected.length === 0) return null;

  const first = selected[0]!;
  const sharedStroke = sharedValue(selected, (s) => s.stroke);
  const sharedFill = sharedValue(selected, (s) => s.fill);
  const sharedWidth = sharedValue(selected, (s) => s.strokeWidth);
  const sharedStyle = sharedValue(selected, (s) => s.strokeStyle ?? 'solid');

  const apply = (patch: Partial<Shape>) => {
    updateShapes(selectedIds.map((id) => ({ id, patch })));
  };

  const supportsFill =
    first.type !== 'line' &&
    first.type !== 'pen' &&
    first.type !== 'arrow' &&
    first.type !== 'connector' &&
    first.type !== 'image';

  const showFontControls = selected.every(
    (s) =>
      s.type === 'text' ||
      ((s.type === 'rect' ||
        s.type === 'roundedRect' ||
        s.type === 'ellipse' ||
        s.type === 'triangle' ||
        s.type === 'diamond' ||
        s.type === 'parallelogram' ||
        s.type === 'hexagon' ||
        s.type === 'cylinder' ||
        s.type === 'star') &&
        Boolean(s.text && s.text.trim())),
  );

  const sharedFontSize = sharedValue(selected, (s) => {
    if (s.type === 'text') return s.fontSize;
    if (
      s.type === 'rect' ||
      s.type === 'roundedRect' ||
      s.type === 'ellipse' ||
      s.type === 'triangle' ||
      s.type === 'diamond' ||
      s.type === 'parallelogram' ||
      s.type === 'hexagon' ||
      s.type === 'cylinder' ||
      s.type === 'star'
    ) {
      return s.fontSize ?? 14;
    }
    return undefined;
  });

  return (
    <aside className={styles.panel} role="complementary" aria-label="Style">
      <div className={styles.field}>
        <div className={styles.label}>Stroke</div>
        <div className={styles.row}>
          {STROKE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Stroke ${color}`}
              className={`${styles.swatch} ${
                sharedStroke === color ? styles.activeSwatch : ''
              }`}
              style={{ background: color }}
              onClick={() => apply({ stroke: color })}
            />
          ))}
        </div>
      </div>

      {supportsFill && (
        <div className={styles.field}>
          <div className={styles.label}>Fill</div>
          <div className={styles.row}>
            {FILL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Fill ${color}`}
                className={`${styles.swatch} ${
                  color === 'transparent' ? styles.swatchTransparent : ''
                } ${sharedFill === color ? styles.activeSwatch : ''}`}
                style={{
                  background:
                    color === 'transparent' ? undefined : color,
                  borderColor:
                    color === '#ffffff' ? 'var(--border-strong)' : undefined,
                }}
                onClick={() => apply({ fill: color })}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.field}>
        <div className={styles.label}>Stroke style</div>
        <div className={styles.styleBtns}>
          {STYLES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.styleBtn} ${
                sharedStyle === id ? styles.activeStyle : ''
              }`}
              onClick={() => apply({ strokeStyle: id })}
              aria-label={label}
            >
              <span
                className={`${styles.dashPreview} ${
                  id === 'dashed' ? styles.dashPreviewDashed : ''
                } ${id === 'dotted' ? styles.dashPreviewDotted : ''}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.label}>Stroke width</div>
        <div className={styles.sliderRow}>
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={12}
            step={1}
            value={sharedWidth ?? 2}
            onChange={(e) =>
              apply({ strokeWidth: Number(e.target.value) })
            }
          />
          <span className={styles.sliderValue}>{sharedWidth ?? '–'}</span>
        </div>
      </div>

      {showFontControls && (
        <div className={styles.field}>
          <div className={styles.label}>Font size</div>
          <div className={styles.sliderRow}>
            <input
              className={styles.slider}
              type="range"
              min={8}
              max={96}
              step={1}
              value={sharedFontSize ?? 14}
              onChange={(e) =>
                apply({ fontSize: Number(e.target.value) } as Partial<Shape>)
              }
            />
            <span className={styles.sliderValue}>{sharedFontSize ?? '–'}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

function sharedValue<T>(
  shapes: Shape[],
  pick: (s: Shape) => T | undefined,
): T | undefined {
  if (shapes.length === 0) return undefined;
  const first = pick(shapes[0]!);
  for (let i = 1; i < shapes.length; i++) {
    if (pick(shapes[i]!) !== first) return undefined;
  }
  return first;
}
