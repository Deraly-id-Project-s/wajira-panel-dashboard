import { useEffect, useMemo, useState } from 'react';
import { PurchaseTransactionItem } from '@/services/laporan-pembelian.service';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { formatDate } from '@/components/ui/format-date';
import { useRouter } from 'next/router';

interface Props {
  data: PurchaseTransactionItem[];
  pagination: { currentPage: number; lastPage: number; total: number; from: number; to: number; perPage: number; };
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

interface PerNotaRow {
  id: string;
  noPembelian: string;
  tanggal: string;
  tipeUnit: string;
  qty: number;
  hargaBeli: number;
  biayaBbn: number;
  biayaEkspedisi: number;
  biayaLainnya: number;
  hpp: number;
  dpp: number;
  ppn: number;
  jumlah: number;
}

const toNumber = (val: unknown) => {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (val: number) => `Rp ${Number(val).toLocaleString('id-ID')}`;

export default function LaporanPembelianPerNota({ data, pagination, isLoading, onPageChange }: Props) {
  const router = useRouter();
  const slug = router.query.slug as string;

  const columns = useMemo<ColumnDef<PurchaseTransactionItem>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, idx) => idx + 1 + ((pagination.currentPage || 1) - 1) * (pagination.perPage || 10),
      },
      {
        header: 'NO PEMBELIAN',
        accessorKey: 'transaction_code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.transaction_code} />
      },
      {
        header: 'TGL BELI',
        accessorKey: 'transaction_date',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.transaction_date),
      },
      {
        header: 'TIPE UNIT',
        accessorKey: 'unit_name',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${encodeURIComponent(item.unit_name || '')}`}>
            {item.unit_name || '-'}
          </ReferenceLink>
        ),
      },
      {
        header: 'QTY',
        accessorKey: 'qty',
        sortable: true,
        alignment: 'center',
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'price',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.price),
      },
      {
        header: 'BIAYA BBN',
        accessorKey: 'bbn',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.bbn),
      },
      {
        header: 'BIAYA EKSPEDISI',
        accessorKey: 'expedition_fee',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.expedition_fee),
      },
      {
        header: 'BIAYA LAINNYA',
        accessorKey: 'other_fee',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.other_fee),
      },
      {
        header: 'HPP',
        accessorKey: 'hpp_fee',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.hpp_fee),
      },
      {
        header: 'DPP',
        accessorKey: 'dpp',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.dpp),
      },
      {
        header: 'PPN',
        accessorKey: 'ppn',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatCurrency(item.ppn),
      },
      {
        header: 'JUMLAH',
        accessorKey: 'total',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="font-semibold text-slate-900">{formatCurrency(item.total)}</span>
        ),
      },
    ],
    [pagination.currentPage, pagination.perPage, slug]
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      meta={{
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        lastPage: pagination.lastPage,
        total: pagination.total,
      }}
      onPageChange={onPageChange}
    />
  );
}
