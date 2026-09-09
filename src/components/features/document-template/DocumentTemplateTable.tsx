import { useMemo } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { DocumentTemplate } from '@/@types/document-template.types';

interface Props {
  data: DocumentTemplate[];
  loading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (item: DocumentTemplate) => void;
  onDelete: (item: DocumentTemplate) => void;
}

export function DocumentTemplateTable({ data, loading, canEdit, canDelete, onEdit, onDelete }: Props) {
  const columns = useMemo<ColumnDef<DocumentTemplate>[]>(() => [
    { header: 'NAMA TEMPLATE', accessorKey: 'name', sortable: true, className: 'font-medium text-slate-900' },
    { header: 'BAHASA', accessorKey: 'language', sortable: true, cell: (item) => item.language.toUpperCase() },
    { header: 'SUBJECT', accessorKey: 'subject', sortable: true },
    { header: 'PENANDATANGAN', accessorKey: 'personSigner' },
    { header: 'DIPERBARUI', accessorKey: 'updatedAt', cell: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('id-ID') : '-' },
    {
      header: 'AKSI', id: 'actions', alignment: 'center', sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={!canEdit} onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem disabled={!canDelete} onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600">Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [canEdit, canDelete, onEdit, onDelete]);

  return <BaseTable data={data} columns={columns} loading={loading} />;
}
