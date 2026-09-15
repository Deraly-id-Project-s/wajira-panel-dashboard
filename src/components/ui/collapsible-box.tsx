import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollapsibleBoxProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  contentClassName?: string;
}

/** Reusable bordered section with an accessible minimize/expand control. */
export function CollapsibleBox({
  title,
  description,
  children,
  defaultExpanded = true,
  className,
  contentClassName,
}: CollapsibleBoxProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  return (
    <section className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-slate-950">{title}</span>
          {description ? <span className="mt-0.5 block text-sm text-slate-500">{description}</span> : null}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn('h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200', expanded && 'rotate-180')}
        />
      </button>
      <div id={contentId} hidden={!expanded} className={cn('border-t border-slate-100 p-5', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
