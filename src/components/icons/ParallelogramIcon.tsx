import type { LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export const ParallelogramIcon = forwardRef<SVGSVGElement, LucideProps>(
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
      <path d="M7 5h13l-3 14H4L7 5z" />
    </svg>
  ),
);

ParallelogramIcon.displayName = 'ParallelogramIcon';
