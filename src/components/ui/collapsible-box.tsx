import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleBoxProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
}

/** Reusable bordered section with an accessible minimize/expand control. */
export function CollapsibleBox({
  title,
  description,
  icon: Icon,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
  actions,
}: CollapsibleBoxProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  return (
    <section className={cn('overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-all', className)}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 sm:px-6',
          headerClassName
        )}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-orange-700">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{description}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {actions ? <div onClick={(e) => e.stopPropagation()}>{actions}</div> : null}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100/80 text-slate-500 transition-colors hover:bg-slate-200/80">
            <ChevronDown
              aria-hidden="true"
              className={cn('h-4 w-4 shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
            />
          </div>
        </div>
      </button>
      <div id={contentId} hidden={!expanded} className={cn('border-t border-slate-100 p-5 sm:p-6', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
