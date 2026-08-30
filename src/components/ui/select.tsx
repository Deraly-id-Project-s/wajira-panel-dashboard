'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
>(({ className, size = 'default', children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-size={size}
    className={cn('flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm shadow-sm', 'focus:outline-none focus:ring-2 focus:ring-ring', size === 'sm' ? 'h-8' : 'h-9', className)}
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

const getTextContent = (node: React.ReactNode): string => {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join(' ');
  if (React.isValidElement(node)) {
    return getTextContent(node.props.children);
  }
  return '';
};

const filterChildren = (children: React.ReactNode, term: string): React.ReactNode => {
  if (!term) return children;
  const lowerTerm = term.toLowerCase();

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (child.type === SelectItem || (child.type as any).displayName === 'SelectItem') {
      const itemText = child.props.children;
      const textContent = getTextContent(itemText).toLowerCase();
      if (textContent.includes(lowerTerm)) {
        return child;
      }
      return null;
    }

    if (child.props && child.props.children) {
      const filtered = filterChildren(child.props.children, term);
      if (React.Children.count(filtered) === 0) {
        return null;
      }
      return React.cloneElement(child, { children: filtered } as any);
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

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          'relative z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
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
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-popover z-10">
            <input
              placeholder={searchPlaceholder || 'Cari...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        )}

        <SelectPrimitive.Viewport className="p-1">
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
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-1.5 pl-2 pr-8 text-sm outline-none',
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

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value {...props} />;
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
