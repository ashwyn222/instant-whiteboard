import { cloneElement, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

type Side = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  label: string;
  hotkey?: string;
  side?: Side;
  offset?: number;
  children: ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    ref?: React.Ref<HTMLElement>;
  }>;
}

interface Position {
  left: number;
  top: number;
  transform: string;
}

function computePosition(
  rect: DOMRect,
  side: Side,
  offset: number,
): Position {
  switch (side) {
    case 'right':
      return {
        left: rect.right + offset,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
    case 'left':
      return {
        left: rect.left - offset,
        top: rect.top + rect.height / 2,
        transform: 'translate(-100%, -50%)',
      };
    case 'top':
      return {
        left: rect.left + rect.width / 2,
        top: rect.top - offset,
        transform: 'translate(-50%, -100%)',
      };
    case 'bottom':
      return {
        left: rect.left + rect.width / 2,
        top: rect.bottom + offset,
        transform: 'translateX(-50%)',
      };
  }
}

export function Tooltip({
  label,
  hotkey,
  side = 'right',
  offset = 10,
  children,
}: TooltipProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<Position | null>(null);

  const show = () => {
    const node = triggerRef.current;
    if (!node) return;
    setPos(computePosition(node.getBoundingClientRect(), side, offset));
  };

  const hide = () => setPos(null);

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      show();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      {pos &&
        createPortal(
          <div
            className={styles.tooltip}
            style={{
              left: pos.left,
              top: pos.top,
              transform: pos.transform,
            }}
            role="tooltip"
          >
            {label}
            {hotkey && <kbd>{hotkey}</kbd>}
          </div>,
          document.body,
        )}
    </>
  );
}

interface TooltipChildren {
  children: ReactNode;
}

export type { TooltipChildren };
