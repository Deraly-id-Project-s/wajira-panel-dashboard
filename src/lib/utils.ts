import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates whether a route parameter or identifier is a real, serialized value
 * and not an unhydrated Next.js route template placeholder (e.g. "[id]", "[unitId]")
 * or an invalid path literal.
 */
export function isValidParamId(id?: unknown): id is string {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('[') || trimmed.endsWith(']')) return false;
  if (
    [
      'undefined',
      'null',
      'unit',
      'penjualan-unit',
      'pembelian-unit',
      'detail',
      'create',
      'edit',
    ].includes(trimmed.toLowerCase())
  ) {
    return false;
  }
  return true;
}

// Currency helpers have moved to `@/lib/utils/currency`
export { formatCurrency, formatCurrencyCompact } from './utils/currency';
