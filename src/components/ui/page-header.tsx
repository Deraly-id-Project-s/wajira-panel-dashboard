import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  /** Array of breadcrumbs. The last item is rendered as active text. */
  breadcrumbs?: BreadcrumbItem[];
  /** Main title of the page */
  title: React.ReactNode;
  /** Subtitle or metadata (e.g. badges, codes) */
  subtitle?: React.ReactNode;
  /** Callback when back button is clicked. If not provided, back button is hidden. */
  onBack?: () => void;
  /** Action buttons rendered on the right side */
  actions?: React.ReactNode;
  /** Additional wrapper class names */
  className?: string;
  /** Hides the entire header when printing. Default is true. */
  hideOnPrint?: boolean;
}

export function PageHeader({
  breadcrumbs,
  title,
  subtitle,
  onBack,
  actions,
  className = '',
  hideOnPrint = true,
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 sm:space-y-5 ${hideOnPrint ? 'print:hidden' : ''} ${className}`}>
      {/* BREADCRUMB HEADER */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-slate-500 sm:gap-2 sm:text-sm">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className={`${index < breadcrumbs.length - 1 ? 'hidden sm:block' : 'block'} h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4`} />}
              {item.onClick ? (
                <button type="button" className={`${index < breadcrumbs.length - 2 ? 'hidden sm:inline' : 'inline'} min-w-0 truncate hover:text-slate-800`} onClick={item.onClick}>
                  {item.label}
                </button>
              ) : (
                <span aria-current="page" className={`${index < breadcrumbs.length - 2 ? 'hidden sm:inline' : 'inline'} min-w-0 truncate font-medium text-slate-800`}>{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* HEADLINE & ACTIONS */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-md border border-slate-200 hover:bg-slate-50 sm:h-10 sm:w-10"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
          )}
          <div className="min-w-0 space-y-1">
            <h1 className="break-words text-xl font-semibold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && <div className="flex w-full flex-col items-stretch gap-2 [&>*]:w-full sm:flex-row sm:items-center sm:[&>*]:w-auto md:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
