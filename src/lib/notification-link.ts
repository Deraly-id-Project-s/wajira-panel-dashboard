import type { AppNotificationType } from '@/@types/app-notification.types';

/**
 * Resolves a notification link into a valid frontend URL within the current company dashboard scope.
 * Handles both relative backend links (e.g. "/transaction/do-expedition/2") and existing dashboard paths.
 */
export function resolveNotificationUrl(
  link: string | null | undefined,
  slug?: string | null,
  type?: AppNotificationType,
): string {
  const safeSlug = slug ? encodeURIComponent(slug) : '';
  const prefix = safeSlug ? `/dashboard/${safeSlug}` : '/dashboard';

  if (!link || link === '#' || link.trim() === '') {
    // Fallback based on notification type
    switch (type) {
      case 'do_expedition':
        return `${prefix}/do-ekspedisi`;
      case 'unit_transaction':
        return `${prefix}/transaksi/pembelian-unit`;
      case 'finance':
        return `${prefix}/finance/transaksi-kas-harian`;
      default:
        return prefix;
    }
  }

  const cleanLink = link.trim();

  // Full external URL
  if (/^https?:\/\//i.test(cleanLink)) {
    return cleanLink;
  }

  // Already prefixed with /dashboard
  if (cleanLink.startsWith('/dashboard/')) {
    return cleanLink;
  }

  // Handle DO Expedition link: /transaction/do-expedition/:id -> /dashboard/:slug/do-ekspedisi/detail/:id
  const doExpMatch = cleanLink.match(/^\/transaction\/do-expedition\/(\d+)/i);
  if (doExpMatch) {
    return `${prefix}/do-ekspedisi/detail/${doExpMatch[1]}`;
  }
  if (/^\/transaction\/do-expedition\/?$/i.test(cleanLink)) {
    return `${prefix}/do-ekspedisi`;
  }

  // Handle Unit Transaction link: /transaction/unit-transaction/:id -> /dashboard/:slug/transaksi/pembelian-unit/:id
  const unitMatch = cleanLink.match(/^\/transaction\/unit-transaction\/(\d+)/i);
  if (unitMatch) {
    return `${prefix}/transaksi/pembelian-unit/${unitMatch[1]}`;
  }
  if (/^\/transaction\/unit-transaction\/?$/i.test(cleanLink)) {
    return `${prefix}/transaksi/pembelian-unit`;
  }

  // Handle Finance link: /finance/daily-cash-flow/:id -> /dashboard/:slug/finance/transaksi-kas-harian
  if (/^\/finance\/daily-cash-flow/i.test(cleanLink) || /^\/finance\/transaksi-kas-harian/i.test(cleanLink)) {
    return `${prefix}/finance/transaksi-kas-harian`;
  }

  // Generic relative link starting with /
  if (cleanLink.startsWith('/')) {
    return `${prefix}${cleanLink}`;
  }

  return `${prefix}/${cleanLink}`;
}
