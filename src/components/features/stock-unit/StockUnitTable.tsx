import type { ReactNode } from 'react';
import { StockStatus, StockUnit } from '@/types/stock-unit.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { cn } from '@/lib/utils';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';
import { Badge } from '@/components/ui/badge';

interface Props {
  data: StockUnit[];
  isLoading: boolean;
  page: number;
  perPage: number;
  totalData: number;
  statusTabs?: ReactNode;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Backend enum statuses
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Retur Beli', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refund Jual', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },

  // Fallback / legacy statuses
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-medium' },
  cancel: { label: 'Cancel', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  rejected: { label: 'Rejected', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  prepare: { label: 'Prepare', className: 'border-amber-200 bg-amber-50 text-amber-700 font-medium' },
  inbound_purcase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_incoming_goods: { label: 'In Transit', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_receipt: { label: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  inbound_return: { label: 'Refund', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_reserved: { label: 'Reserved', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_in_transit: { label: 'In Transit', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-medium' },
  outbound_delivered: { label: 'Delivered', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-medium' },
  outbound_return: { label: 'Return', className: 'border-rose-200 bg-rose-50 text-rose-700 font-medium' },
};

const renderStatus = (status: string) => {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};

export default function StockUnitTable({
  data,
  isLoading,
  page,
  perPage,
  totalData,
  statusTabs,
  onPageChange,
  onPerPageChange,
  search,
  onSearchChange,
}: Props) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns: ColumnDef<StockUnit>[] = [
    {
      header: 'Nama Unit',
      accessorKey: 'namaUnit',
      sortable: true,
      alignment: 'left',
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slugStr}/master/type-unit?search=${item?.namaUnit}`}>
          {item.namaUnit}
        </ReferenceLink>
      ),
    },
    {
      header: 'Warna',
      accessorKey: 'warna',
      sortable: true,
      alignment: 'left',
    },
    {
      header: 'Nomor Mesin',
      accessorKey: 'noMesin',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.noMesin} />,
    },
    {
      header: 'Nomor Rangka',
      accessorKey: 'noRangka',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.noRangka} />,
    },
    {
      header: 'Sub Blok',
      accessorKey: 'warehouseSubBlock',
      alignment: 'center',
      sortable: true,
      tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
      cell: (item) => item.warehouseSubBlock?.name ? <CopyBox text={item.warehouseSubBlock.name} /> : <Badge variant='outline' className={`font-semibold bg-white`}>Belum Ditambahkan</Badge>,
    },
    {
      header: 'Status Stok',
      accessorKey: 'status',
      sortable: true,
      alignment: 'center',
      tooltip: 'Status ketersediaan unit fisik di gudang',
      cell: (item) => item?.inStock ? <Badge variant="outline" className={cn('capitalize', 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold')}>Tersedia</Badge> : <Badge variant="outline" className={cn('capitalize', 'border-rose-200 bg-rose-50 text-rose-700 font-semibold')}>Tidak Tersedia {item?.isSoldUnit && '/ Terjual'}</Badge>
    },
    {
      header: 'Kondisi Stok',
      accessorKey: 'status',
      sortable: true,
      alignment: 'center',
      tooltip: 'Kondisi fisik unit saat ini',
      cell: (item) => renderStatus(item.status),
    },
    {
      header: 'Posisi Stok',
      accessorKey: 'stockStatus',
      sortable: true,
      alignment: 'center',
      tooltip: 'Posisi logistik atau status alur stok unit',
      cell: (item) => {
        const config: Record<string, { label: string; name: string; className: string }> = {
          draft: { label: 'Draft', name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-semibold' },
          cancel: { label: 'Cancel', name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
          prepare: { label: 'Prepare', name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
          purchase_order: { label: 'Purchase Order', name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
          in_transit: { label: 'In Transit', name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold' },
          receipt: { label: 'Receipt', name: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
        };
        const stateVal = item?.stockStatus ?? 'draft';
        const match = config[stateVal] ?? {
          label: stateVal.replace(/_/g, ' '),
          className: 'border-slate-200 bg-slate-50 text-slate-700 font-semibold',
        };

        const isRefund = item?.status === 'returned' || item?.status === 'refunded';
        const isReceipt = (stateVal as string) === 'receipt' || (stateVal as string) === 'inbound_receipt';

        return (
          <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
            {isReceipt ? (isRefund ? 'Dikembalikan' : (item?.isSoldUnit ? 'Dikirim' : 'Diterima')) : match.label}
          </Badge>
        );
      }
    },
  ];

  const meta = {
    currentPage: page,
    perPage,
    lastPage: Math.max(1, Math.ceil(totalData / perPage)),
    total: totalData,
  };

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      searchPlaceholder="Search here"
      search={search}
      onSearchChange={onSearchChange}
      showLimitChange
      perPage={perPage}
      onPerPageChange={onPerPageChange}
      meta={meta}
      onPageChange={onPageChange}
      headerActions={statusTabs}
    />
  );
}
