'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextTruncate } from '@/components/ui/text-truncate';

/* ================= Root ================= */

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />;
}

/* ================= Trigger ================= */

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: 'sm' | 'default';
  }
>(({ className, size = 'default', children, onClick, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-size={size}
    className={cn('flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm shadow-sm', 'focus:outline-none focus:ring-2 focus:ring-ring', size === 'sm' ? 'h-8' : 'h-9', className)}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* ================= Content ================= */

const getTextContent = (node: React.ReactNode | unknown): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join(' ');
  if (React.isValidElement(node)) {
    return getTextContent((node as React.ReactElement<any>).props.children);
  }
  return '';
};

const filterChildren = (children: React.ReactNode, term: string): React.ReactNode => {
  if (!term) return children;
  const lowerTerm = term.toLowerCase();

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const element = child as React.ReactElement<any>;

    if (element.type === SelectItem || (element.type as any).displayName === 'SelectItem') {
      const itemText = element.props.children;
      const textContent = getTextContent(itemText).toLowerCase();
      if (textContent.includes(lowerTerm)) {
        return child;
      }
      return null;
    }

    if (element.props && element.props.children) {
      const filtered = filterChildren(element.props.children, term);
      if (React.Children.count(filtered) === 0) {
        return null;
      }
      return React.cloneElement(element, { children: filtered } as any);
    }

    return child;
  });
};

/* ================= Content ================= */

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    showSearch?: boolean;
    searchPlaceholder?: string;
  }
>(({ className, children, position = 'popper', showSearch = false, searchPlaceholder, ...props }, ref) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const filteredChildren = React.useMemo(() => {
    return filterChildren(children, searchTerm);
  }, [children, searchTerm]);

  const hasItems = React.useMemo(() => {
    let count = 0;
    React.Children.forEach(filteredChildren, (child) => {
      if (child !== null && child !== undefined) {
        count++;
      }
    });
    return count > 0;
  }, [filteredChildren]);

  // Keep focus on the search input when typing/filtering so Radix does not steal focus
  React.useLayoutEffect(() => {
    if (showSearch && searchInputRef.current) {
      const input = searchInputRef.current;
      input.focus({ preventScroll: true });
      const rafId = requestAnimationFrame(() => {
        if (document.activeElement !== input) {
          input.focus({ preventScroll: true });
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [searchTerm, showSearch, filteredChildren]);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-[10050] max-w-[calc(100vw-1rem)] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
          <ChevronUpIcon className="h-4 w-4" />
        </SelectPrimitive.ScrollUpButton>

        {showSearch && (
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-popover p-2">
            <input
              ref={searchInputRef}
              placeholder={searchPlaceholder || 'Cari...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-base placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:text-sm"
              onKeyDown={(e) => {
                e.stopPropagation();
              }}
              onKeyDownCapture={(e) => {
                if (e.key !== 'Escape') {
                  e.stopPropagation();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerDownCapture={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <SelectPrimitive.Viewport className="max-w-[calc(100vw-1rem)] overflow-x-auto overscroll-contain p-1">
          {filteredChildren}
          {!hasItems && (
            <div className="px-3 py-4 text-center text-xs text-slate-500">
              Data tidak ditemukan.
            </div>
          )}
        </SelectPrimitive.Viewport>

        <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
          <ChevronDownIcon className="h-4 w-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

/* ================= Item ================= */

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    maxLength?: number;
  }
>(({ className, children, maxLength = 15, ...props }, ref) => {
  const content = React.useMemo(() => {
    if (typeof children === 'string' || typeof children === 'number') {
      return <TextTruncate text={String(children)} maxLength={maxLength} />;
    }
    return children;
  }, [children, maxLength]);

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex min-w-max cursor-pointer select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{content}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = 'SelectItem';

function SelectValue({
  placeholder,
  maxLength = 15,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value> & { maxLength?: number }) {
  const renderedPlaceholder = React.useMemo(() => {
    if (typeof placeholder === 'string' && placeholder.length > maxLength) {
      return <TextTruncate text={placeholder} maxLength={maxLength} />;
    }
    return placeholder;
  }, [placeholder, maxLength]);

  return <SelectPrimitive.Value placeholder={renderedPlaceholder} {...props}>{children}</SelectPrimitive.Value>;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
