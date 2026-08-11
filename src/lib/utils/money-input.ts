function normalizeUsdString(value: string): string {
  // Strip currency symbol and spaces
  const cleaned = value.replace(/[^0-9.,]/g, '');
  // For USD, standard thousands separator is comma. We strip all commas.
  return cleaned.replace(/,/g, '');
}

export function formatMoneyInput(value: string | number, currency: 'IDR' | 'USD' = 'IDR') {
  if (currency === 'USD') {
    const normalized = normalizeUsdString(String(value));
    if (!normalized) return '';

    const parts = normalized.split('.');
    const integerPart = parts[0] ? Number(parts[0]).toLocaleString('en-US') : '';
    const formatted = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;

    if (!formatted && String(value).includes('.')) return '$ 0.';
    if (!formatted) return '';
    return `$ ${formatted}`;
  }
  const strVal = typeof value === 'number' ? Math.max(0, Math.floor(value)).toString() : value;
  const numeric = strVal.replace(/\D/g, '');
  if (!numeric) return '';
  return 'Rp. ' + numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseMoneyInput(value: string | number, currency: 'IDR' | 'USD' = 'IDR'): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (currency === 'USD') {
    const normalized = normalizeUsdString(String(value));
    if (!normalized || normalized === '.') return 0;
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }
  const normalized = String(value).replace(/\D/g, '');
  if (!normalized) return 0;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Membatasi (clamp) nilai angka nominal agar tidak melebihi nilai maksimal (maxLimit).
 * Jika maxLimit ditentukan dan input melebihi maxLimit, nilai akan otomatis diganti menjadi maxLimit.
 */
export function clampMoneyValue(value: number, maxLimit?: number): number {
  const safeVal = Math.max(0, value);
  if (maxLimit !== undefined && maxLimit !== null && maxLimit >= 0) {
    return Math.min(safeVal, maxLimit);
  }
  return safeVal;
}

/**
 * Helper untuk memposting/memproses masukan (input) nominal uang dari komponen form.
 * Mengubah string/number input menjadi number murni dan membatasi nilainya ke maxLimit jika melebihi.
 * 
 * @example
 * const maxAllowed = 5000000;
 * const amount = parseAndClampMoneyInput('10.000.000', maxAllowed); // returns 5000000
 */
export function parseAndClampMoneyInput(value: string | number, maxLimit?: number, currency: 'IDR' | 'USD' = 'IDR'): number {
  const numericValue = parseMoneyInput(value, currency);
  return clampMoneyValue(numericValue, maxLimit);
}
