import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BounceLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size in pixels (default: 60) */
  size?: number;
  /** Color of the loader (default: rgba(237, 51, 59, 0.75) - soft red) */
  color?: string;
  /** Speed multiplier (default: 1) */
  speedMultiplier?: number;
}

/**
 * Reusable BounceLoader component styled after react-spinners BounceLoader.
 * Implemented with pure CSS variables and global keyframes for maximum performance and compatibility.
 */
export function BounceLoader({
  size = 60,
  color,
  speedMultiplier = 1,
  className,
  style,
  ...props
}: BounceLoaderProps) {
  const duration = `${2.1 / speedMultiplier}s`;
  const delay = `-${1.05 / speedMultiplier}s`;
  const resolvedColor = color || 'rgba(237, 51, 59, 0.75)';

  const containerStyle = {
    '--bl-size': `${size}px`,
    '--bl-color': resolvedColor,
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
          width: '100%',
          height: '100%',
          borderRadius: '100%',
          backgroundColor: resolvedColor,
          opacity: 0.6,
          animation: `bounce-loader-anim ${duration} infinite ease-in-out`,
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '100%',
          backgroundColor: resolvedColor,
          opacity: 0.6,
          animation: `bounce-loader-anim ${duration} infinite ease-in-out`,
          animationDelay: delay,
        }}
      />
    </div>
  );
}
