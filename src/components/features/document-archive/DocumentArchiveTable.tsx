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
import type { DocumentArchive } from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_LABELS } from '@/@types/document-archive.types';
import { formatDate } from '@/components/ui/format-date';

interface Props {
  data: DocumentArchive[];
  loading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDetail: (item: DocumentArchive) => void;
  onEdit: (item: DocumentArchive) => void;
  onUpdateFile: (item: DocumentArchive) => void;
  onDelete: (item: DocumentArchive) => void;
}

export function DocumentArchiveTable({
  data,
  loading,
  canEdit,
  canDelete,
  onDetail,
  onEdit,
  onUpdateFile,
  onDelete,
}: Props) {
  const columns = useMemo<ColumnDef<DocumentArchive>[]>(() => [
    {
      header: 'No',
      alignment: 'left',
      className: 'w-[60px] text-slate-400 font-mono text-xs',
      cell: (_, index) => (index !== undefined ? index + 1 : '-'),
    },
    {
      header: 'Kode Dokumen',
      accessorKey: 'documentCode',
      cell: (item) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-slate-900">{item.documentCode || '-'}</span>
          <div className="flex items-center gap-1">
            {item.isLatest ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] py-0 px-1.5">
                Terbaru
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] py-0 px-1.5">
                Revisi Lama
              </Badge>
            )}
            {item.format && (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[10px] py-0 px-1.5 uppercase font-mono">
                {item.format}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Nama Dokumen',
      accessorKey: 'name',
      cell: (item) => (
        <div>
          <p className="line-clamp-1 text-sm font-medium text-slate-900">{item.name}</p>
          {item.notes && <p className="line-clamp-1 text-xs text-slate-500 mt-0.5">{item.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Tipe',
      accessorKey: 'type',
      cell: (item) => (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 capitalize font-medium">
          {DOCUMENT_ARCHIVE_TYPE_LABELS[item.type] ?? item.type}
        </Badge>
      ),
    },
    {
      header: 'Status',
      alignment: 'left',
      cell: (item) => (
        <div className="flex flex-col items-start gap-1">
          <Badge
            variant="outline"
            className={
              item.isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            }
          >
            {item.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
          {item.isExpired && (
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 text-[10px]">
              Kedaluwarsa
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Tanggal Dibuat',
      accessorKey: 'createdAt',
      alignment: 'left',
      cell: (item) => (
        <span className="text-xs text-slate-600">
          {formatDate(item.createdAt, true)}
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
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={() => onDetail(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
              >
                Detail
              </DropdownMenuItem>
              {item.fileUrl && (
                <DropdownMenuItem
                  onClick={() => window.open(item.fileUrl!, '_blank')}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Buka Berkas
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                disabled={!canEdit}
                onClick={() => onEdit(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canEdit}
                onClick={() => onUpdateFile(item)}
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Ganti Berkas
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!canDelete}
                onClick={() => onDelete(item)}
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [canEdit, canDelete, onDetail, onEdit, onUpdateFile, onDelete]);

  return <BaseTable data={data} columns={columns} loading={loading} />;
}
