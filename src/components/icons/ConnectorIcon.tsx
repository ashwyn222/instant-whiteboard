import type { LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export const ConnectorIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, color = 'currentColor', strokeWidth = 2, ...rest }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M4 5h7v14h7" />
      <path d="m15 16 3 3-3 3" />
    </svg>
  ),
);

ConnectorIcon.displayName = 'ConnectorIcon';
