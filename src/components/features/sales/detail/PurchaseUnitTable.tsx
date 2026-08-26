import { useState, useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Trash2 } from 'lucide-react';
import type { UnitItem } from '@/types/sales';
import { toast } from 'sonner';

interface Props {
  units: UnitItem[];
  salesId: string;
}

export function PurchaseUnitTable({ units }: Props) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const confirmDelete = () => {
    if (deleteId) {
      toast.success('Unit deleted successfully');
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<UnitItem>[]>(
    () => [
      {
        header: 'WARNA',
        accessorKey: 'color',
        sortable: true,
        className: 'text-slate-700',
        cell: (item) => item.color || '-',
      },
      {
        header: 'NOMOR MESIN',
        accessorKey: 'engineNumber',
        sortable: true,
        className: 'text-slate-700 font-medium',
        cell: (item) => item.engineNumber || '-',
      },
      {
        header: 'NOMOR RANGKA',
        accessorKey: 'chassisNumber',
        sortable: true,
        className: 'text-slate-700',
        cell: (item) => item.chassisNumber || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (unit) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg px-3 py-2 text-sm" onClick={() => setDeleteId(unit.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  const totalPages = Math.ceil(units.length / perPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return units.slice(start, start + perPage);
  }, [units, page, perPage]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Detail Pembelian Unit</h3>
        <p className="text-sm text-muted-foreground">Rincian lengkap unit yang dibeli</p>
      </div>

      <BaseTable
        data={paginatedData}
        columns={columns}
        showLimitChange
        perPage={perPage}
        onPerPageChange={(val) => {
          setPerPage(val);
          setPage(1);
        }}
        meta={{
          currentPage: page,
          perPage,
          lastPage: totalPages,
          total: units.length,
        }}
        onPageChange={setPage}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the unit from our servers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
