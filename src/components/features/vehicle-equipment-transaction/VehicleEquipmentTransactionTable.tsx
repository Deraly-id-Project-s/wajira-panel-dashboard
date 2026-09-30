'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { VehicleEquipmentTransaction } from '@/@types/vehicle-equipment-transaction.types';

interface VehicleEquipmentTransactionTableProps {
  data: VehicleEquipmentTransaction[];
  slug: string;
  type: 'purchase' | 'sales';
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  loading?: boolean;
}

export default function VehicleEquipmentTransactionTable({
  data,
  slug,
  type,
  onDelete,
  canEdit,
  canDelete,
  loading,
}: VehicleEquipmentTransactionTableProps) {
  const router = useRouter();
  const isSales = type === 'sales';
  const baseRoute = isSales ? 'penjualan-perlengkapan' : 'pembelian-perlengkapan';
  const partyLabel = isSales ? 'Customer' : 'Supplier';
  const partyMaster = isSales ? 'customer' : 'supplier';

  const getPartyName = useCallback((item: VehicleEquipmentTransaction) => (
    item.person?.name || item.customer?.name || item.supplier?.name || (item.person_id ? String(item.person_id) : '-')
  ), []);

  const getEquipmentName = useCallback((item: VehicleEquipmentTransaction) => (
    item.vehicle_equipment?.name || (item.vehicle_equipment_id ? String(item.vehicle_equipment_id) : '-')
  ), []);

  const columns = useMemo<ColumnDef<VehicleEquipmentTransaction>[]>(() => [
    {
      header: 'Kode Transaksi',
      accessorKey: 'code',
      sortable: true,
      cell: (item) => <CopyBox text={item.code || '-'} />,
    },
    {
      header: 'Tanggal',
      accessorKey: 'transaction_date',
      sortable: true,
      cell: (item) => formatDate(item.transaction_date || item.created_at || '') || '-',
    },
    {
      header: partyLabel,
      accessorKey: 'person.name',
      sortable: true,
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/${partyMaster}?search=${encodeURIComponent(getPartyName(item))}`}>
          {getPartyName(item) === String(item.person_id) ? `${partyLabel} #${item.person_id}` : getPartyName(item)}
        </ReferenceLink>
      ),
    },
    {
      header: 'Perlengkapan',
      accessorKey: 'vehicle_equipment.name',
      sortable: true,
      cell: (item) => (
        <ReferenceLink href={`/dashboard/${slug}/master/vehicle-equipment?search=${encodeURIComponent(getEquipmentName(item))}`}>
          {getEquipmentName(item) === String(item.vehicle_equipment_id) ? `Perlengkapan #${item.vehicle_equipment_id}` : getEquipmentName(item)}
        </ReferenceLink>
      ),
    },
    {
      header: 'Qty',
      accessorKey: 'qty',
      alignment: 'center',
      sortable: true,
      cell: (item) => item.qty || 0,
    },
    {
      header: 'Netto Total',
      accessorKey: 'transaction_netto_total',
      alignment: 'right',
      sortable: true,
      cell: (item) => currenciesFormat('idr', item.transaction_netto_total ?? ((item.qty || 0) * (item.price || 0))),
    },
    {
      header: 'Sisa Pembayaran',
      accessorKey: 'billing_summary.remaining_payment',
      alignment: 'right',
      sortable: true,
      cell: (item) => {
        const remaining = Number(item.billing_summary?.remaining_payment ?? item.goods_transaction_billing?.is_remaining_payment ?? 0);
        return <span className={cn(remaining > 0 && 'font-semibold text-red-600')}>{currenciesFormat('idr', remaining)}</span>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'billing_summary.is_paid',
      alignment: 'center',
      sortable: true,
      cell: (item) => {
        const isPaid = Boolean(item.goods_transaction_billing?.is_paid ?? item.billing_summary?.is_paid);
        return (
          <Badge
            variant="outline"
            className={cn(
              'font-semibold',
              isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
            )}
          >
            {isPaid ? 'Lunas' : 'Belum Lunas'}
          </Badge>
        );
      },
    },
    {
      header: 'Warehouse',
      accessorKey: 'has_warehouse_activity',
      alignment: 'center',
      cell: (item) => (
        <Badge
          variant="outline"
          className={cn(
            'font-semibold',
            item.has_warehouse_activity ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600',
          )}
        >
          {item.has_warehouse_activity ? 'Diproses' : 'Belum'}
        </Badge>
      ),
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/${slug}/transaksi/${baseRoute}/${item.id}`)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm"
            >
              Detail
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                disabled={Boolean(item.goods_transaction_billing?.is_paid)}
                onClick={() => router.push(`/dashboard/${slug}/transaksi/${baseRoute}/edit/${item.id}`)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm"
              >
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                disabled={Boolean(item.goods_transaction_billing?.is_paid)}
                onClick={() => onDelete(String(item.id))}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                Hapus
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [baseRoute, canDelete, canEdit, getEquipmentName, getPartyName, onDelete, partyLabel, partyMaster, router, slug]);

  return <BaseTable data={data} columns={columns} loading={loading} headerRowClassName="bg-slate-50/80" />;
}
