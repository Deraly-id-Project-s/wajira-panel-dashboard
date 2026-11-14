import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DocumentCode } from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_LABELS } from '@/@types/document-archive.types';
import { TextTruncate } from '@/components/ui/text-truncate';
import { formatDate } from '@/components/ui/format-date';

interface Props {
  data: DocumentCode[];
  loading?: boolean;
  canEdit: boolean;
  onEdit: (item: DocumentCode) => void;
}

export function DocumentCodeTable({ data, loading, canEdit, onEdit }: Props) {
  const columns = useMemo<ColumnDef<DocumentCode>[]>(() => [
    {
      header: 'No',
      alignment: 'left',
      cell: (_, index) => (index !== undefined ? index + 1 : '-'),
    },
    {
      header: 'Tipe Dokumen',
      accessorKey: 'type',
      cell: (item) => (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 capitalize font-medium">
          {DOCUMENT_ARCHIVE_TYPE_LABELS[item.type] ?? item.type}
        </Badge>
      ),
    },
    {
      header: 'Nama',
      accessorKey: 'name',
    },
    {
      header: 'Kode Prefix',
      accessorKey: 'code',
      cell: (item) => (
        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs tracking-wider">
          {item.code}
        </span>
      ),
    },
    {
      header: 'Deskripsi',
      accessorKey: 'description',
      cell: (item) => <TextTruncate text={item.description || '-'} maxLength={48} className="block max-w-[300px] truncate" />,
    },
    {
      header: 'Diperbarui',
      accessorKey: 'updatedAt',
      alignment: 'left',
      cell: (item) => (
        <span className="text-xs text-slate-600">
          {formatDate(item.updatedAt)}
        </span>
      ),
    },
    {
      header: 'Aksi',
      id: 'actions',
      alignment: 'left',
      sticky: 'right',
      cell: (item) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                disabled={!canEdit}
                onClick={() => onEdit(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [canEdit, onEdit]);

  return <BaseTable data={data} columns={columns} loading={loading} />;
}
