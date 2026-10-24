export function currenciesFormat(currency: 'idr' | 'usd', value: number | string | undefined | null): string {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  const safeValue = (numericValue === undefined || numericValue === null || Number.isNaN(numericValue)) ? 0 : numericValue;
  if (currency === 'idr') {
    const parts = safeValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp. ${integerPart},${parts[1]}`;
  } else {
    const parts = safeValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${integerPart}.${parts[1]}`;
  }
}
