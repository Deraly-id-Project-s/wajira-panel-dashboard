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
    <div className={`space-y-6 ${hideOnPrint ? 'print:hidden' : ''} ${className}`}>
      {/* BREADCRUMB HEADER */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
              {item.onClick ? (
                <span className="hover:text-slate-800 cursor-pointer" onClick={item.onClick}>
                  {item.label}
                </span>
              ) : (
                <span className="font-medium text-slate-800">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* HEADLINE & ACTIONS */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">{actions}</div>}
      </div>
    </div>
  );
}
