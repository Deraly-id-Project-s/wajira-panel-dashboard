import { useMemo } from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { MoreVertical } from 'lucide-react';
import type { TypeUnit } from '@/@types/type-unit.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface TypeUnitTableProps {
  typeUnits: TypeUnit[];
  isLoading?: boolean;
  onEdit: (typeUnit: TypeUnit) => void;
  onDelete: (typeUnit: TypeUnit) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TypeUnitTable({
  typeUnits,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: TypeUnitTableProps) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const columns = useMemo<ColumnDef<TypeUnit>[]>(
    () => [
      {
        header: 'KODE TIPE',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.code} />,
      },
      {
        header: 'MEREK',
        accessorKey: 'brand.name',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <ReferenceLink href={`/dashboard/${slugStr}/master/brand?search=${encodeURIComponent(item.brand?.name ?? item.brandId ?? '')}`}>
            {item.brand?.name ?? item.brandId}
          </ReferenceLink>
        ),
      },
      {
        header: 'TIPE UNIT',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
      },
      {
        header: 'JENIS',
        accessorKey: 'unitType',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.unitType || '-',
      },
      {
        header: 'MODEL',
        accessorKey: 'unitModel',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.unitModel || '-',
      },
      {
        header: 'NETTO (KG)',
        accessorKey: 'nettoWeight',
        sortable: true,
        alignment: 'center',
        cell: (item) => item.nettoWeight ?? '-',
      },
      {
        header: 'BRUTO (KG)',
        accessorKey: 'brutoWeight',
        sortable: true,
        alignment: 'center',
        cell: (item) => item.brutoWeight ?? '-',
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'buyPrice',
        sortable: true,
        alignment: 'center',
        cell: (item) =>
          item.buyPrice !== null && item.buyPrice !== undefined
            ? currenciesFormat('idr', item.buyPrice)
            : '-',
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sellPrice',
        sortable: true,
        alignment: 'center',
        cell: (item) =>
          item.sellPrice !== null && item.sellPrice !== undefined
            ? currenciesFormat('idr', item.sellPrice)
            : '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/${slugStr}/master/type-unit/${item.id}`)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canEdit, canDelete, onEdit, onDelete, slugStr, router]
  );

  return (
    <BaseTable
      data={typeUnits}
      columns={columns}
      loading={isLoading}
    />
  );
}
