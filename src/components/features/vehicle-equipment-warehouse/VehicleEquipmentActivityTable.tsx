'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { Button } from '@/components/ui/button';
import { ReferenceLink } from '@/components/ui/reference-link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TextTruncate } from '@/components/ui/text-truncate';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { WarehouseActivity } from '@/@types/warehouse.types';

interface VehicleEquipmentActivityTableProps {
  data: WarehouseActivity[];
  type: 'receipt' | 'issue';
  isLoading?: boolean;
}

const getStateConfig = (state?: string) => {
  const normalized = state?.toLowerCase();
  if (normalized === 'done') return { label: 'Selesai', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (normalized === 'process') return { label: 'Proses', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: normalized === 'draft' ? 'Draft' : state || '-', className: 'border-slate-200 bg-slate-50 text-slate-700' };
};

export default function VehicleEquipmentActivityTable({ data, type, isLoading }: VehicleEquipmentActivityTableProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const isIssue = type === 'issue';
  const baseRoute = isIssue ? 'perlengkapan-keluar' : 'perlengkapan-masuk';
  const partyLabel = isIssue ? 'Customer' : 'Supplier';
  const partyMaster = isIssue ? 'customer' : 'supplier';

  const columns = useMemo<ColumnDef<WarehouseActivity>[]>(() => [
    {
      header: isIssue ? 'No Pengeluaran' : 'No Penerimaan',
      accessorKey: 'activity_number',
      sortable: true,
      cell: (item) => <CopyBox text={item.activity_number || item.noPenerimaan || '-'} />,
    },
    {
      header: 'Tanggal',
      accessorKey: 'activity_date',
      sortable: true,
      cell: (item) => formatDate(item.activity_date || item.tanggal || '') || '-',
    },
    {
      header: partyLabel,
      accessorKey: 'person.name',
      sortable: true,
      cell: (item) => item.person?.name ? (
        <ReferenceLink href={`/dashboard/${slug}/master/${partyMaster}?search=${encodeURIComponent(item.person.name)}`}>
          {item.person.name}
        </ReferenceLink>
      ) : '-',
    },
    {
      header: 'Status',
      accessorKey: 'state',
      sortable: true,
      cell: (item) => {
        const config = getStateConfig(item.state);
        return <Badge variant="outline" className={cn('font-semibold', config.className)}>{config.label}</Badge>;
      },
    },
    {
      header: 'Keterangan',
      accessorKey: 'description',
      sortable: true,
      cell: (item) => <TextTruncate text={item.description || item.keterangan || '-'} maxLength={32} />,
    },
    {
      header: 'Aksi',
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
              onClick={() => router.push(`/dashboard/${slug}/warehouse/${baseRoute}/${item.id}`)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm"
            >
              Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [baseRoute, isIssue, partyLabel, partyMaster, router, slug]);

  return <BaseTable data={data} columns={columns} loading={isLoading} headerRowClassName="bg-slate-50/80" />;
}
