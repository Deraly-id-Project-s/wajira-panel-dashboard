import { format } from 'date-fns';

export const formatKasBonDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd/MM/yyyy');
};

export const getKasBonApprovalLabel = (isApprove: boolean) => (isApprove ? 'Disetujui' : 'Menunggu');

export const getKasBonApprovalClassName = (isApprove: boolean) =>
  isApprove
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
