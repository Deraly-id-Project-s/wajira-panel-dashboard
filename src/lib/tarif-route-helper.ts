import type { Tarif } from '@/@types/tarif.types';

export function formatTarifRouteName(tarif?: Tarif | null, fallback = '-'): string {
  if (!tarif) return fallback;

  if (tarif.routes && tarif.routes.length > 0) {
    const sorted = [...tarif.routes].sort((a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0));
    return sorted.map((r) => r.name).filter(Boolean).join(' ➔ ') || fallback;
  }

  const parts = [tarif.loadingIn, tarif.loadingOut].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' ➔ ');
  }

  return fallback;
}

export function formatTarifShortLabel(tarif?: Tarif | null, fallback = '-'): { origin: string; destination: string } {
  if (!tarif) return { origin: fallback, destination: fallback };

  if (tarif.routes && tarif.routes.length > 0) {
    const sorted = [...tarif.routes].sort((a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0));
    const originRoute = sorted.find((r) => r.pivot?.state_at === 'loading_in') || sorted[0];
    const destRoute = sorted.find((r) => r.pivot?.state_at === 'loading_out') || sorted[sorted.length - 1];
    return {
      origin: originRoute?.name || tarif.loadingIn || fallback,
      destination: destRoute?.name || tarif.loadingOut || fallback,
    };
  }

  return {
    origin: tarif.loadingIn || fallback,
    destination: tarif.loadingOut || fallback,
  };
}
