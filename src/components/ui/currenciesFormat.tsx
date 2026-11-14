export function currenciesFormat(
  currency: 'idr' | 'usd' | number | string,
  value?: number | string | undefined | null
): string {
  let curr: 'idr' | 'usd' = 'idr';
  let val: number | string | undefined | null = value;

  if (
    typeof currency === 'number' ||
    (!isNaN(Number(currency)) && typeof currency === 'string' && value === undefined)
  ) {
    val = currency;
    curr = 'idr';
  } else if (typeof currency === 'string') {
    curr = currency.toLowerCase() === 'usd' ? 'usd' : 'idr';
  }

  const numericValue = typeof val === 'string' ? Number(val) : val;
  const safeValue =
    numericValue === undefined || numericValue === null || Number.isNaN(numericValue)
      ? 0
      : numericValue;

  if (curr === 'idr') {
    const parts = safeValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp. ${integerPart},${parts[1]}`;
  } else {
    const parts = safeValue.toFixed(2).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$ ${integerPart}.${parts[1]}`;
  }
}

export default currenciesFormat;
