import * as React from 'react';
import { cn } from '@/lib/utils';

export interface HashLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size in pixels (default: 20) */
  size?: number;
  /** Color of the loader (default: currentColor) */
  color?: string;
  /** Speed multiplier (default: 1) */
  speedMultiplier?: number;
}

/**
 * Reusable HashLoader component styled after react-spinners HashLoader.
 * Implemented with pure CSS variables and global keyframes for maximum performance and compatibility.
 */
export function HashLoader({
  size = 20,
  color,
  speedMultiplier = 1,
  className,
  style,
  ...props
}: HashLoaderProps) {
  const thickness = Math.max(2, Math.round(size / 5));
  const offset = Math.round(size / 2);
  const duration = `${2 / speedMultiplier}s`;
  const resolvedColor = color || 'currentColor';

  const containerStyle = {
    '--hl-size': `${size}px`,
    '--hl-thickness': `${thickness}px`,
    '--hl-offset': `${offset}px`,
    '--hl-color': resolvedColor,
    width: size,
    height: size,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-block relative shrink-0', className)}
      style={containerStyle}
      {...props}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: thickness,
          height: '100%',
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
          animation: `hash-loader-lat-anim ${duration} infinite ease-in-out`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: thickness,
          backgroundColor: resolvedColor,
          borderRadius: thickness / 2,
          animation: `hash-loader-lon-anim ${duration} infinite ease-in-out`,
        }}
      />
    </div>
  );
}
