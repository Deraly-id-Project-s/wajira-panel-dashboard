import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollapsibleBox } from '@/components/ui/collapsible-box';

interface CardContextValue {
  expanded: boolean;
  toggleExpanded: () => void;
  isCollapsible: boolean;
  registerHeader: () => void;
}

const CardContext = React.createContext<CardContextValue | null>(null);

export interface CardProps extends React.ComponentProps<'div'> {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
}

function Card({
  collapsible = true,
  defaultExpanded = true,
  title,
  description,
  icon,
  actions,
  className,
  children,
  ...props
}: CardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [hasHeader, setHasHeader] = React.useState(false);

  const toggleExpanded = React.useCallback(() => {
    setExpanded((curr) => !curr);
  }, []);

  const registerHeader = React.useCallback(() => {
    setHasHeader(true);
  }, []);

  const isCollapsible = collapsible !== false;

  const contextValue = React.useMemo(
    () => ({
      expanded,
      toggleExpanded,
      isCollapsible,
      registerHeader,
    }),
    [expanded, toggleExpanded, isCollapsible, registerHeader]
  );

  if (title) {
    return (
      <CollapsibleBox
        title={title}
        description={description}
        icon={icon}
        actions={actions}
        defaultExpanded={defaultExpanded}
        className={className}
      >
        {children}
      </CollapsibleBox>
    );
  }

  return (
    <CardContext.Provider value={contextValue}>
      <div
        data-slot="card"
        data-expanded={expanded}
        data-collapsible={isCollapsible}
        className={cn(
          'rounded-xl border border-slate-200 bg-card text-card-foreground shadow-sm transition-all overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

function CardHeader({ className, children, onClick, ...props }: React.ComponentProps<'div'>) {
  const ctx = React.useContext(CardContext);

  React.useEffect(() => {
    ctx?.registerHeader();
  }, [ctx]);

  const isCollapsible = ctx?.isCollapsible ?? false;
  const expanded = ctx?.expanded ?? true;

  if (isCollapsible && ctx) {
    return (
      <div
        data-slot="card-header"
        aria-expanded={expanded}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) {
            ctx.toggleExpanded();
          }
        }}
        className={cn(
          'flex items-center justify-between gap-4 px-6 py-4 cursor-pointer select-none transition-colors hover:bg-slate-50/80 border-b border-slate-100',
          className
        )}
        {...props}
      >
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100/80 text-slate-500 transition-colors hover:bg-slate-200/80">
            <ChevronDown
              aria-hidden="true"
              className={cn('h-4 w-4 shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="card-header"
      className={cn('@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 py-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('leading-none font-semibold text-slate-900', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardAction({ className, onClick, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, children, ...props }: React.ComponentProps<'div'>) {
  const ctx = React.useContext(CardContext);

  if (ctx && ctx.isCollapsible && !ctx.expanded) {
    return null;
  }

  return (
    <div
      data-slot="card-content"
      className={cn('px-6 py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: React.ComponentProps<'div'>) {
  const ctx = React.useContext(CardContext);

  if (ctx && ctx.isCollapsible && !ctx.expanded) {
    return null;
  }

  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 py-4 [.border-t]:pt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent, CollapsibleBox as CollapsibleCard };
