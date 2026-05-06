import {
  MousePointer2,
  Hand,
  Square,
  RectangleHorizontal,
  Circle,
  Triangle,
  Diamond,
  Hexagon,
  Database,
  Star,
  Minus,
  ArrowRight,
  Pencil,
  Type,
  Eraser,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  Download,
  type LucideIcon,
} from 'lucide-react';
import { ParallelogramIcon } from '../icons/ParallelogramIcon';
import { ConnectorIcon } from '../icons/ConnectorIcon';
import { useBoardStore } from '../../store/boardStore';
import { dialogConfirm } from '../../store/dialogStore';
import type { Tool } from '../../store/types';
import { exportStageToPNG } from '../../lib/export';
import { getStage } from '../../lib/stage';
import { pickImageFile } from '../../lib/imageInsert';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Toolbar.module.css';

interface ToolItem {
  id: Tool;
  Icon: LucideIcon;
  label: string;
  hotkey: string;
}

interface ToolSection {
  label: string;
  items: ToolItem[];
}

const SECTIONS: ToolSection[] = [
  {
    label: 'Tools',
    items: [
      { id: 'select', Icon: MousePointer2, label: 'Select', hotkey: 'V' },
      { id: 'hand', Icon: Hand, label: 'Pan', hotkey: 'H' },
    ],
  },
  {
    label: 'Shapes',
    items: [
      { id: 'rect', Icon: Square, label: 'Rectangle', hotkey: 'R' },
      {
        id: 'roundedRect',
        Icon: RectangleHorizontal,
        label: 'Pill (Start/End)',
        hotkey: 'B',
      },
      { id: 'ellipse', Icon: Circle, label: 'Ellipse', hotkey: 'O' },
      { id: 'triangle', Icon: Triangle, label: 'Triangle', hotkey: 'G' },
      { id: 'diamond', Icon: Diamond, label: 'Diamond', hotkey: 'D' },
      {
        id: 'parallelogram',
        Icon: ParallelogramIcon as LucideIcon,
        label: 'I/O',
        hotkey: 'I',
      },
      { id: 'hexagon', Icon: Hexagon, label: 'Hexagon', hotkey: 'X' },
      { id: 'cylinder', Icon: Database, label: 'Database', hotkey: 'Y' },
      { id: 'star', Icon: Star, label: 'Star', hotkey: 'S' },
    ],
  },
  {
    label: 'Lines',
    items: [
      { id: 'line', Icon: Minus, label: 'Line', hotkey: 'L' },
      { id: 'arrow', Icon: ArrowRight, label: 'Arrow', hotkey: 'A' },
      {
        id: 'connector',
        Icon: ConnectorIcon as LucideIcon,
        label: 'Connector',
        hotkey: 'C',
      },
      { id: 'pen', Icon: Pencil, label: 'Pen', hotkey: 'P' },
    ],
  },
  {
    label: 'Other',
    items: [
      { id: 'text', Icon: Type, label: 'Text', hotkey: 'T' },
      { id: 'eraser', Icon: Eraser, label: 'Eraser', hotkey: 'E' },
    ],
  },
];

interface ActionItem {
  id: string;
  Icon: LucideIcon;
  label: string;
  hotkey?: string;
  onClick: () => void;
}

export function Toolbar() {
  const tool = useBoardStore((s) => s.tool);
  const setTool = useBoardStore((s) => s.setTool);
  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);
  const clear = useBoardStore((s) => s.clear);
  const canUndo = useBoardStore((s) => s.past.length > 0);
  const canRedo = useBoardStore((s) => s.future.length > 0);
  const hasShapes = useBoardStore((s) => s.shapes.length > 0);

  const handleClear = async () => {
    const ok = await dialogConfirm({
      title: 'Clear board',
      description: 'This removes everything. You can undo with ⌘Z right after.',
      confirmLabel: 'Clear',
      destructive: true,
    });
    if (ok) clear();
  };

  const handleExport = () => {
    const stage = getStage();
    if (!stage) return;
    exportStageToPNG(stage);
  };

  return (
    <aside className={styles.toolbar} role="toolbar" aria-label="Tools">
      {SECTIONS.map((section, idx) => {
        const extras: ActionItem[] =
          section.label === 'Other'
            ? [
                {
                  id: 'image',
                  Icon: ImageIcon,
                  label: 'Insert image',
                  onClick: () => {
                    void pickImageFile();
                  },
                },
              ]
            : [];
        return (
          <div key={section.label} className={styles.section}>
            {idx > 0 && <div className={styles.divider} aria-hidden />}
            <div className={styles.sectionLabel}>{section.label}</div>
            <div className={styles.grid}>
              {section.items.map(({ id, Icon, label, hotkey }) => (
                <Tooltip key={id} label={label} hotkey={hotkey} side="right">
                  <button
                    type="button"
                    className={`${styles.button} ${
                      tool === id ? styles.active : ''
                    }`}
                    aria-label={label}
                    aria-pressed={tool === id}
                    onClick={() => setTool(id)}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                  </button>
                </Tooltip>
              ))}
              {extras.map(({ id, Icon, label, hotkey, onClick }) => (
                <Tooltip key={id} label={label} hotkey={hotkey} side="right">
                  <button
                    type="button"
                    className={styles.button}
                    aria-label={label}
                    onClick={onClick}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        );
      })}

      <div className={styles.section}>
        <div className={styles.divider} aria-hidden />
        <div className={styles.sectionLabel}>History</div>
        <div className={styles.grid}>
          <Tooltip label="Undo" hotkey="⌘Z" side="right">
            <button
              type="button"
              className={styles.button}
              aria-label="Undo"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
          <Tooltip label="Redo" hotkey="⇧⌘Z" side="right">
            <button
              type="button"
              className={styles.button}
              aria-label="Redo"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.divider} aria-hidden />
        <div className={styles.sectionLabel}>Actions</div>
        <div className={styles.grid}>
          <Tooltip label="Export PNG" side="right">
            <button
              type="button"
              className={styles.button}
              aria-label="Export PNG"
              disabled={!hasShapes}
              onClick={handleExport}
            >
              <Download size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
          <Tooltip label="Clear board" side="right">
            <button
              type="button"
              className={styles.button}
              aria-label="Clear board"
              disabled={!hasShapes}
              onClick={handleClear}
            >
              <Trash2 size={18} strokeWidth={1.75} />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}
