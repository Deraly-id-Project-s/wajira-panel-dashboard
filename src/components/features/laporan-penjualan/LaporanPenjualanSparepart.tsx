import { useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/router';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { SalesSparepartTransactionItem } from '@/services/laporan-penjualan.service';

interface Props {
  activeTab: string;
  data: SalesSparepartTransactionItem[];
  pagination: { currentPage: number; lastPage: number; total: number; from: number; to: number; perPage: number };
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

const formatCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : format(parsed, 'dd MMMM yyyy', { locale: id });
};

export default function LaporanPenjualanSparepart({ activeTab, data, pagination, isLoading, onPageChange }: Props) {
  const router = useRouter();
  const slug = router.query.slug as string;

  const columns = useMemo<ColumnDef<SalesSparepartTransactionItem>[]>(() => {
    const baseColumns: ColumnDef<SalesSparepartTransactionItem>[] = [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, index) => index + 1 + (pagination.currentPage - 1) * pagination.perPage,
      },
      {
        header: 'NO PENJUALAN',
        accessorKey: 'transaction_code',
        sortable: true,
        cell: item => <CopyBox text={item.transaction_code} />,
      },
      {
        header: 'TGL JUAL',
        accessorKey: 'transaction_date',
        sortable: true,
        alignment: 'center',
        cell: item => formatDate(item.transaction_date),
      },
    ];

    if (activeTab === 'per-customer') {
      baseColumns.push({
        header: 'NAMA CUSTOMER',
        accessorKey: 'person_name',
        sortable: true,
        cell: item => (
          <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${encodeURIComponent(item.person_name || '')}`}>
            {item.person_name || '-'}
          </ReferenceLink>
        ),
      });
    }

    baseColumns.push(
      {
        header: 'SPAREPART',
        accessorKey: 'sparepart_name',
        sortable: true,
        cell: item => (
          <ReferenceLink href={`/dashboard/${slug}/master/sparepart?search=${encodeURIComponent(item.sparepart_name || '')}`}>
            {item.sparepart_name || '-'}
          </ReferenceLink>
        ),
      },
      { header: 'KODE', accessorKey: 'sparepart_code', sortable: true, cell: item => item.sparepart_code || '-' },
      { header: 'QTY', accessorKey: 'qty', sortable: true, alignment: 'center' },
      { header: 'HARGA JUAL', accessorKey: 'price', sortable: true, alignment: 'right', cell: item => formatCurrency(item.price) },
      { header: 'DISKON', accessorKey: 'discount', sortable: true, alignment: 'center', cell: item => `${Number(item.discount || 0)}%` },
      { header: 'TOTAL JUAL', accessorKey: 'total', sortable: true, alignment: 'right', cell: item => <span className="font-semibold">{formatCurrency(item.total)}</span> },
      {
        header: 'STATUS',
        accessorKey: 'payment_status',
        alignment: 'center',
        cell: item => <Badge variant="outline" className={item.is_paid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{item.payment_status || (item.is_paid ? 'Lunas' : 'Belum Lunas')}</Badge>,
      },
    );

    return baseColumns;
  }, [activeTab, pagination.currentPage, pagination.perPage, slug]);

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      meta={{ currentPage: pagination.currentPage, perPage: pagination.perPage, lastPage: pagination.lastPage, total: pagination.total }}
      onPageChange={onPageChange}
    />
  );
}
