export const getDoEkspedisiStatusBadgeClassName = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'confirm':
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 font-semibold';
    case 'process':
      return 'border-blue-200 bg-blue-50 text-blue-700 font-semibold';
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold';
    case 'failed':
      return 'border-rose-200 bg-rose-50 text-rose-700 font-semibold';
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700 font-semibold';
    case 'reject':
      return 'border-red-200 bg-red-50 text-red-700 font-semibold';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export const getDoEkspedisiStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case 'draft':
      return 'Draft';
    case 'confirm':
      return 'Confirm';
    case 'process':
      return 'Proses';
    case 'done':
      return 'Selesai';
    case 'failed':
      return 'Gagal';
    case 'pending':
      return 'Tertunda';
    case 'reject':
      return 'Ditolak';
    default:
      return status || '-';
  }
};
