'use client';

import * as React from 'react';
import { Maximize2, Minimize2, XIcon } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function closeAllDropdowns() {
  if (typeof document === 'undefined') return;

  // Close open dropdown triggers
  const openTriggers = document.querySelectorAll<HTMLElement>(
    '[data-slot="dropdown-menu-trigger"][aria-expanded="true"], [data-radix-dropdown-menu-trigger][aria-expanded="true"], button[aria-haspopup="menu"][aria-expanded="true"]'
  );
  openTriggers.forEach((trigger) => {
    trigger.click();
  });

  // Notify any active dismissable layers
  document.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
  );
}

const DialogDragContext = React.createContext<{
  isDraggable: boolean;
  isFullscreen: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  toggleFullscreen?: () => void;
}>({
  isDraggable: false,
  isFullscreen: false,
});

function Dialog({ open, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  React.useEffect(() => {
    if (open) {
      closeAllDropdowns();
    }
  }, [open]);

  return <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={onOpenChange} {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn('data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:hidden fixed inset-0 z-[10000] bg-primary/50', className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export type DialogSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '3x'
  | 'full';

const DIALOG_SIZE_MAP: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',         // 384px
  md: 'sm:max-w-md',         // 448px
  lg: 'sm:max-w-lg',         // 512px (standard default modal)
  xl: 'sm:max-w-xl',         // 576px
  '2xl': 'sm:max-w-2xl',     // 672px
  '3xl': 'sm:max-w-3xl',     // 768px
  '4xl': 'sm:max-w-4xl',     // 896px
  '5xl': 'sm:max-w-5xl',     // 1024px (2x standard)
  '6xl': 'sm:max-w-6xl',     // 1152px
  '7xl': 'sm:max-w-7xl',     // 1280px (2.5x standard)
  '3x': 'sm:max-w-[1536px]', // 1536px (3x lebar modal standar 512px!)
  full: 'sm:max-w-[calc(100vw-2rem)]',
};

export interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
  showMaximizeButton?: boolean;
  closeOnInteractOutside?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  defaultFullscreen?: boolean;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  minWidth?: number;
  minHeight?: number;
  width?: string | number;
  maxWidth?: string | number;
  size?: DialogSize;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({
  className,
  children,
  showCloseButton = true,
  showMaximizeButton = true,
  closeOnInteractOutside = false,
  isDraggable = true,
  isResizable = true,
  defaultFullscreen = false,
  isFullscreen: controlledFullscreen,
  onFullscreenChange,
  minWidth = 320,
  minHeight = 180,
  width,
  maxWidth,
  size,
  onInteractOutside,
  onPointerDownOutside,
  style,
  ...props
}, ref) => {
  React.useEffect(() => {
    closeAllDropdowns();
    return () => {
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  // Fullscreen state (uncontrolled or controlled)
  const [internalFullscreen, setInternalFullscreen] = React.useState(defaultFullscreen);
  const isFullscreen = controlledFullscreen !== undefined ? controlledFullscreen : internalFullscreen;

  const toggleFullscreen = React.useCallback(() => {
    const next = !isFullscreen;
    if (controlledFullscreen === undefined) {
      setInternalFullscreen(next);
    }
    onFullscreenChange?.(next);
  }, [isFullscreen, controlledFullscreen, onFullscreenChange]);

  // Drag state
  const [position, setPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  // Resize state
  const [resizedDimensions, setResizedDimensions] = React.useState<{ width?: number; height?: number }>({});
  const [resizingDir, setResizingDir] = React.useState<string | null>(null);
  const resizeRef = React.useRef({
    startX: 0,
    startY: 0,
    origW: 0,
    origH: 0,
    origX: 0,
    origY: 0,
    dir: '',
  });

  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const setMergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref]
  );

  // Drag Handler (only active when not in fullscreen mode)
  const handleDragStart = (e: React.PointerEvent) => {
    if (!isDraggable || isFullscreen) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"], [data-slot="dialog-close"], [data-slot="dialog-maximize"]')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging || isFullscreen) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const nextX = dragRef.current.origX + dx;
    const nextY = dragRef.current.origY + dy;

    // Viewport clamping
    const maxX = typeof window !== 'undefined' ? window.innerWidth / 2 - 60 : 400;
    const minX = -maxX;
    const maxY = typeof window !== 'undefined' ? window.innerHeight / 2 - 60 : 300;
    const minY = -maxY;

    setPosition({
      x: Math.max(minX, Math.min(maxX, nextX)),
      y: Math.max(minY, Math.min(maxY, nextY)),
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Resize Handler (only active when not in fullscreen mode)
  const handleResizeStart = (dir: string, e: React.PointerEvent) => {
    if (!isResizable || isFullscreen) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;

    setResizingDir(dir);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW: rect.width,
      origH: rect.height,
      origX: position.x,
      origY: position.y,
      dir,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (!resizingDir || isFullscreen) return;
    const { startX, startY, origW, origH, origX, origY, dir } = resizeRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const minW = minWidth;
    const minH = minHeight;
    const maxW = typeof window !== 'undefined' ? window.innerWidth - 32 : 1400;
    const maxH = typeof window !== 'undefined' ? window.innerHeight - 32 : 900;

    let newW = origW;
    let newH = origH;
    let newX = origX;
    let newY = origY;

    if (dir.includes('e')) {
      newW = Math.max(minW, Math.min(maxW, origW + dx));
      newX = origX + (newW - origW) / 2;
    }
    if (dir.includes('w')) {
      newW = Math.max(minW, Math.min(maxW, origW - dx));
      newX = origX - (newW - origW) / 2;
    }
    if (dir.includes('s')) {
      newH = Math.max(minH, Math.min(maxH, origH + dy));
      newY = origY + (newH - origH) / 2;
    }
    if (dir.includes('n')) {
      newH = Math.max(minH, Math.min(maxH, origH - dy));
      newY = origY - (newH - origH) / 2;
    }

    setResizedDimensions({ width: newW, height: newH });
    setPosition({ x: newX, y: newY });
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (resizingDir) {
      setResizingDir(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Global pointerup fallback
  React.useEffect(() => {
    if (!isDragging && !resizingDir) return;
    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setResizingDir(null);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, [isDragging, resizingDir]);

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogDragContext.Provider
        value={{
          isDraggable: isDraggable && !isFullscreen,
          isFullscreen,
          onDragStart: handleDragStart,
          toggleFullscreen,
        }}
      >
        <DialogPrimitive.Content
          ref={setMergedRef}
          data-slot="dialog-content"
          data-fullscreen={isFullscreen}
          onInteractOutside={(event) => {
            onInteractOutside?.(event);
            if (!closeOnInteractOutside) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            onPointerDownOutside?.(event);
            if (!closeOnInteractOutside) event.preventDefault();
          }}
          onPointerMove={(e) => {
            if (isDragging) handleDragMove(e);
            if (resizingDir) handleResizeMove(e);
          }}
          onPointerUp={(e) => {
            if (isDragging) handleDragEnd(e);
            if (resizingDir) handleResizeEnd(e);
          }}
          style={{
            ...(isFullscreen
              ? {
                  transform: 'none',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                }
              : {
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                  ...(resizedDimensions.width ? { width: `${resizedDimensions.width}px`, maxWidth: 'none' } : {}),
                  ...(resizedDimensions.height ? { height: `${resizedDimensions.height}px`, maxHeight: 'none' } : {}),
                  ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
                  ...(maxWidth !== undefined ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : {}),
                }),
            ...style,
            // Ensure fullpage mode takes absolute priority over any user passed style
            ...(isFullscreen
              ? {
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100vw',
                  height: '100vh',
                  maxWidth: '100vw',
                  maxHeight: '100vh',
                  borderRadius: 0,
                }
              : {}),
          }}
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:hidden fixed z-[10000] grid gap-4 border shadow-lg outline-none',
            isFullscreen
              ? 'inset-0 top-0 left-0 w-screen h-screen max-w-none max-h-none rounded-none border-none p-6 sm:max-w-none transition-all duration-150'
              : cn(
                  'top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] rounded-md p-6 transition-all duration-150',
                  size
                    ? DIALOG_SIZE_MAP[size] || ''
                    : (Boolean(maxWidth) || Boolean(width) || /(?:^|\s)(?:sm:|md:|lg:|xl:|2xl:)?max-w-/.test(className || '')
                        ? ''
                        : 'sm:max-w-lg')
                ),
            isDragging && 'transition-none select-none',
            className,
          )}
          {...props}
        >
          {/* Subtle top drag grip indicator (only when in modal mode) */}
          {isDraggable && !isFullscreen && (
            <div
              onPointerDown={handleDragStart}
              className="absolute top-0 left-12 right-20 h-3.5 cursor-grab active:cursor-grabbing z-30 flex justify-center items-center group touch-none"
              title="Klik & tahan untuk menggeser dialog"
            >
              <div className="w-8 h-1 rounded-full bg-slate-200/80 group-hover:bg-slate-400 transition-colors" />
            </div>
          )}

          {/* Resizer handles (only when in modal mode) */}
          {isResizable && !isFullscreen && (
            <>
              {/* 4 Edges */}
              <div
                onPointerDown={(e) => handleResizeStart('n', e)}
                className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('s', e)}
                className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('w', e)}
                className="absolute top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('e', e)}
                className="absolute top-3 bottom-3 -right-1.5 w-3 cursor-ew-resize z-30 touch-none"
              />

              {/* 4 Corners */}
              <div
                onPointerDown={(e) => handleResizeStart('nw', e)}
                className="absolute -top-2 -left-2 w-5 h-5 cursor-nwse-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('ne', e)}
                className="absolute -top-2 -right-2 w-5 h-5 cursor-nesw-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('sw', e)}
                className="absolute -bottom-2 -left-2 w-5 h-5 cursor-nesw-resize z-30 touch-none"
              />
              <div
                onPointerDown={(e) => handleResizeStart('se', e)}
                className="absolute -bottom-2 -right-2 w-5 h-5 cursor-nwse-resize z-30 touch-none flex items-end justify-end p-1 group"
                title="Tarik untuk mengubah ukuran dialog"
              >
                <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-300 group-hover:border-slate-500 rounded-br-[2px] transition-colors" />
              </div>
            </>
          )}

          {children}

          {/* Action Buttons: Fullscreen/Modal Mode Toggle & Close Button */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-40">
            {showMaximizeButton && (
              <button
                type="button"
                onClick={toggleFullscreen}
                data-slot="dialog-maximize"
                className="ring-offset-background focus:ring-ring rounded-xs opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 focus:ring-2 focus:ring-offset-2 focus:outline-hidden cursor-pointer flex items-center justify-center text-slate-500 hover:text-slate-900"
                title={isFullscreen ? 'Kembali ke Mode Modal' : 'Mode Layar Penuh (Fullpage)'}
                aria-label={isFullscreen ? 'Kembali ke Mode Modal' : 'Mode Layar Penuh'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}

            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground rounded-xs opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none cursor-pointer flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <XIcon className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogDragContext.Provider>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, onPointerDown, onDoubleClick, ...props }, ref) => {
  const { isDraggable, isFullscreen, onDragStart, toggleFullscreen } = React.useContext(DialogDragContext);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    if (isDraggable && !isFullscreen && onDragStart) {
      onDragStart(e);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onDoubleClick?.(e);
    toggleFullscreen?.();
  };

  return (
    <div
      ref={ref}
      data-slot="dialog-header"
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'flex flex-col gap-2 text-center sm:text-left pr-16',
        isDraggable && !isFullscreen && 'cursor-grab active:cursor-grabbing select-none',
        className
      )}
      {...props}
    />
  );
});
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    showCloseButton?: boolean;
  }
>(({ className, showCloseButton = false, children, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="dialog-footer"
    className={cn(
      'flex flex-col-reverse items-stretch gap-2 [&>*]:w-full sm:flex-row sm:items-center sm:justify-end sm:[&>*]:w-auto',
      className,
    )}
    {...props}
  >
    {children}
    {showCloseButton && (
      <DialogPrimitive.Close asChild>
        <Button variant="outline" className="w-full sm:w-auto">Close</Button>
      </DialogPrimitive.Close>
    )}
  </div>
));
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn('text-lg leading-none font-semibold', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
