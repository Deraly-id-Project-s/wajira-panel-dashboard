export const COMPANY_LETTERHEAD_MAP: Record<number, string> = {
  1: '/invoice-letter/1-morindo-letter.jpeg',
  2: '/invoice-letter/2-internasional-letter.jpeg',
  3: '/invoice-letter/3-yanotama-letter.jpeg',
  4: '/invoice-letter/4-jagrataratransindo-letter.jpeg',
  5: '/invoice-letter/5-adhiyasagradasta-letter.jpeg',
};

export function normalizeCompanyId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;

  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function resolveCompanyId(
  slug: string | string[] | undefined,
  fallbackCompanyId: string | number | null | undefined
): number | null {
  const slugValue = Array.isArray(slug) ? slug[0] : slug;

  // Prefer numeric slug if route uses /dashboard/{id}/...
  const slugId = normalizeCompanyId(slugValue);
  if (slugId) return slugId;

  // Fallback to selected company from context/local storage sync.
  return normalizeCompanyId(fallbackCompanyId);
}

export function getLetterheadByCompanyId(companyId: number | null): string {
  if (!companyId) return '';
  return COMPANY_LETTERHEAD_MAP[companyId] || '';
}

export function getCompanyName(companyId?: number | null): string {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 2) return 'PT WAJIRA INTERNASIONAL';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  if (companyId === 5) return 'PT ADHIYASA GRADASTA';
  return 'PT WAJIRA JAGRATARA';
}
