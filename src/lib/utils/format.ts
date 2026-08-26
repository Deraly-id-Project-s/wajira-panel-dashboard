/**
 * Formatting Utilities
 * Helper functions untuk format numbers, currency, dan dates
 */

import { Currency } from '@/types/dashboard';

/**
 * Format number dengan thousand separator (titik untuk IDR)
 * @example formatNumber(893000000) => "893.000.000"
 */
export function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format currency dengan symbol dan proper formatting
 */
export function formatCurrency(value: number, currency: Currency): string {
  if (currency === 'IDR') {
    return `${formatNumber(value)} IDR`;
  }

  // USD formatting dengan comma separator
  return `${value.toLocaleString('en-US')} USD`;
}

/**
 * Format money with currency symbol leading (Rp / $) for UI display
 */
export function formatMoney(value: number, currency: Currency): string {
  if (currency === 'IDR') {
    return `Rp ${formatNumber(value)}`;
  }

  return `$ ${value.toLocaleString('en-US')}`;
}

/**
 * Format percentage
 * @example formatPercentage(16) => "16%"
 */
export function formatPercentage(value: number): string {
  return `${value}%`;
}

/**
 * Format compact number (untuk large numbers)
 * @example formatCompactNumber(1500000) => "1.5M"
 */
export function formatCompactNumber(value: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  });
  return formatter.format(value);
}

/**
 * Format date untuk Indonesia locale
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
}

/**
 * Sanitize phone number to allow only digits and a single leading '+' sign.
 */
export function sanitizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
}
