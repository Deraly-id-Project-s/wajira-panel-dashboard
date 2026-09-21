import { useMemo, useState } from 'react';
import { Sparepart } from '@/@types/sparepart.types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Plus, Upload } from 'lucide-react';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

interface Props {
  data: Sparepart[];
  onEdit: (item: Sparepart) => void;
  onDelete: (item: Sparepart) => void;
  onAdd?: () => void;
  onImport?: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function SparepartTable({ data, onEdit, onDelete, onAdd, onImport, canEdit, canDelete }: Props) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortState, setSortState] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'code', direction: 'asc' });
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;

    return data.filter((item) =>
      [item.code, item.name, item.category?.name, item.group, item.unitType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [data, search]);

  const sortedData = useMemo(() => {
    const { key, direction } = sortState;
    if (!key) return filteredData;
    const factor = direction === 'asc' ? 1 : -1;

    return [...filteredData].sort((a: any, b: any) => {
      const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      const valA = getValue(a, key);
      const valB = getValue(b, key);

      if (valA === undefined || valA === null) return 1 * factor;
      if (valB === undefined || valB === null) return -1 * factor;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * factor;
      }

      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && valA.includes('-')) {
        return (dateA - dateB) * factor;
      }

      return String(valA).localeCompare(String(valB)) * factor;
    });
  }, [filteredData, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = useMemo(() => {
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, startIndex, itemsPerPage]);

  const columns = useMemo<ColumnDef<Sparepart>[]>(
    () => [
      {
        header: 'KODE',
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
        cell: (item) => item.brand?.name ? <ReferenceLink href={`/dashboard/${slugStr}/master/brand?search=${item?.brand?.name}`}>
          {item.brand?.name}
        </ReferenceLink> : '-'
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
        accessorKey: 'purchasePrice',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.purchasePrice ?? item.price ?? 0),
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sellingPrice',
        sortable: true,
        alignment: 'center',
        cell: (item) => currenciesFormat('idr', item.sellingPrice ?? item.price ?? 0),
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
              <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canEdit, canDelete, onEdit, onDelete, slugStr]
  );

  return (
    <BaseTable
      data={currentData}
      columns={columns}
      search={search}
      onSearchChange={(val) => {
        setSearch(val);
        setCurrentPage(1);
      }}
      showLimitChange
      perPage={itemsPerPage}
      onPerPageChange={(val) => {
        setItemsPerPage(val);
        setCurrentPage(1);
      }}
      meta={{
        currentPage: currentPage,
        perPage: itemsPerPage,
        lastPage: totalPages,
        total: filteredData.length,
      }}
      onPageChange={setCurrentPage}
      sortBy={sortState.key}
      sortDirection={sortState.direction}
      onSortChange={(key, direction) => setSortState({ key, direction })}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          {onImport && (
            <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          {onAdd && (
            <Button onClick={onAdd} className="btn-primary!">
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          )}
        </div>
      }
    />
  );
}
