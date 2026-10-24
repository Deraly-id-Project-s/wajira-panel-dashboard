export const ACCOUNT_TYPE_OPTIONS = [
  {
    value: 'debet',
    label: 'Debet',
  },
  {
    value: 'credit',
    label: 'Kredit',
  },
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPE_OPTIONS)[number]['value'];

export const ACCOUNT_POS_CODE_OPTIONS = [
  {
    value: 'LR',
    label: 'LR (Laba Rugi)',
  },
  {
    value: 'NRC',
    label: 'NRC (Neraca)',
  },
] as const;

export const ACCOUNT_POS_CATEGORY_OPTIONS = ACCOUNT_POS_CODE_OPTIONS;

export type AccountPosCodeValue = (typeof ACCOUNT_POS_CODE_OPTIONS)[number]['value'];

export const ACCOUNT_CATEGORY_VALUES = [
  'cash_and_bank',
  'accounts_receivable',
  'inventory',
  'other_current_asset',
  'fixed_asset',
  'accumulated_depreciation',
  'accounts_payable',
  'current_liability',
  'long_term_liability',
  'equity',
  'revenue',
  'cost_of_goods_sold',
  'expense',
  'other_income',
  'other_expense',
  'general',
] as const;

export type AccountCategoryValue = (typeof ACCOUNT_CATEGORY_VALUES)[number];

export interface AccountCategoryOption {
  value: AccountCategoryValue;
  label: string;
  type: 'debet' | 'credit';
}

export const ACCOUNT_CATEGORY_OPTIONS: readonly AccountCategoryOption[] = [
  {
    value: 'cash_and_bank',
    label: 'Kas & Bank',
    type: 'debet',
  },
  {
    value: 'accounts_receivable',
    label: 'Piutang Usaha',
    type: 'debet',
  },
  {
    value: 'inventory',
    label: 'Persediaan',
    type: 'debet',
  },
  {
    value: 'other_current_asset',
    label: 'Aset Lancar Lainnya',
    type: 'debet',
  },
  {
    value: 'fixed_asset',
    label: 'Aset Tetap',
    type: 'debet',
  },
  {
    value: 'accumulated_depreciation',
    label: 'Akumulasi Penyusutan',
    type: 'credit',
  },
  {
    value: 'accounts_payable',
    label: 'Utang Usaha',
    type: 'credit',
  },
  {
    value: 'current_liability',
    label: 'Liabilitas Jangka Pendek',
    type: 'credit',
  },
  {
    value: 'long_term_liability',
    label: 'Liabilitas Jangka Panjang',
    type: 'credit',
  },
  {
    value: 'equity',
    label: 'Modal',
    type: 'credit',
  },
  {
    value: 'revenue',
    label: 'Pendapatan',
    type: 'credit',
  },
  {
    value: 'cost_of_goods_sold',
    label: 'Beban Pokok Penjualan (HPP)',
    type: 'debet',
  },
  {
    value: 'expense',
    label: 'Beban',
    type: 'debet',
  },
  {
    value: 'other_income',
    label: 'Pendapatan Lainnya',
    type: 'credit',
  },
  {
    value: 'other_expense',
    label: 'Beban Lainnya',
    type: 'debet',
  },
  {
    value: 'general',
    label: 'Umum',
    type: 'debet',
  },
] as const;

export interface SearchableCategoryOption {
  value: string;
  label: string;
}

export const ACCOUNT_CATEGORY_SEARCHABLE_OPTIONS: SearchableCategoryOption[] = [
  {
    value: 'none',
    label: 'Tanpa Kategori',
  },
  ...ACCOUNT_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  })),
];

export const normalizeAccountCategory = (category?: string | null): AccountCategoryValue | null => {
  if (!category) return null;
  const match = ACCOUNT_CATEGORY_OPTIONS.find(
    (item) => item.value === category || item.label.toLowerCase() === category.toLowerCase(),
  );
  return match?.value ?? null;
};

export const getAccountCategoryLabel = (category?: string | null) => {
  if (!category) return '-';
  const match = ACCOUNT_CATEGORY_OPTIONS.find(
    (item) => item.value === category || item.label.toLowerCase() === category.toLowerCase(),
  );
  return match?.label ?? category;
};

export const getAccountTypeLabel = (type?: string | null) => {
  if (!type) return '-';
  if (type === 'debet' || type === 'debit') return 'Debet';
  if (type === 'credit') return 'Kredit';
  return type;
};

export const getAccountTypeFromCategory = (category?: string | null) => {
  if (!category) return 'debet' as const;
  const match = ACCOUNT_CATEGORY_OPTIONS.find(
    (item) => item.value === category || item.label.toLowerCase() === category.toLowerCase(),
  );
  return match?.type ?? 'debet';
};

export const getAccountCategoryBadgeClass = (category?: string | null): string => {
  if (!category) return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';

  const normalized = normalizeAccountCategory(category);
  switch (normalized) {
    case 'cash_and_bank':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50';
    case 'accounts_receivable':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'inventory':
      return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
    case 'other_current_asset':
    case 'fixed_asset':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-50';
    case 'accumulated_depreciation':
      return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100';
    case 'accounts_payable':
    case 'current_liability':
    case 'long_term_liability':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50';
    case 'equity':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50';
    case 'revenue':
    case 'other_income':
      return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-50';
    case 'cost_of_goods_sold':
    case 'expense':
    case 'other_expense':
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50';
    case 'general':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';
  }
};
