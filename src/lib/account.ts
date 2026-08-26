export const ACCOUNT_CATEGORY_OPTIONS = [
  {
    value: 'general',
    label: 'Umum',
    type: 'debet',
  },
  {
    value: 'operational',
    label: 'Operasional',
    type: 'debet',
  },
  {
    value: 'director_receivable',
    label: 'Piutang Direksi',
    type: 'debet',
  },
  {
    value: 'shareholder_receivable',
    label: 'Piutang Pemegang Saham',
    type: 'debet',
  },
  {
    value: 'receivable',
    label: 'Piutang',
    type: 'debet',
  },
  {
    value: 'inventory',
    label: 'Persediaan',
    type: 'debet',
  },
] as const;

export type AccountCategoryValue = (typeof ACCOUNT_CATEGORY_OPTIONS)[number]['value'];

export const getAccountCategoryLabel = (category?: string | null) => {
  if (!category) return '-';
  return ACCOUNT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
};

export const getAccountTypeFromCategory = (category?: string | null) => {
  if (!category) return 'debet' as const;
  return ACCOUNT_CATEGORY_OPTIONS.find((item) => item.value === category)?.type ?? 'debet';
};
