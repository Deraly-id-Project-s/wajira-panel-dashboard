import React from 'react';

/**
 * Standard formatDate helper function:
 * Formats a date string or Date object into 'dd MMM yyyy' (id-ID locale)
 * with optional time 'HH:mm'.
 *
 * @param value - Date string, Date instance, or null/undefined
 * @param includeTime - Whether to include 'hour: 2-digit, minute: 2-digit'
 * @returns Formatted date string, or '-' if invalid/null
 */
export const formatDate = (value?: string | Date | null, includeTime = false): string => {
  if (!value) return '-';
  const parsedDate = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsedDate.getTime())) return typeof value === 'string' ? value : '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsedDate);
};

export interface FormatDateProps extends React.HTMLAttributes<HTMLSpanElement> {
  value?: string | Date | null;
  includeTime?: boolean;
}

/**
 * Reusable FormatDate component for rendering standard formatted dates across views.
 *
 * @example
 * <FormatDate value={trx.createdAt} includeTime className="text-slate-600" />
 */
export function FormatDate({
  value,
  includeTime = false,
  className,
  ...props
}: FormatDateProps) {
  return (
    <span className={className} {...props}>
      {formatDate(value, includeTime)}
    </span>
  );
}

export default FormatDate;
