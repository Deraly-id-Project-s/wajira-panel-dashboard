'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { WarehouseActivity } from '@/@types/warehouse.types';
import { PaginationMeta } from '@/@types/pagination.types';
import { MoreVertical, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';
import { Badge } from '@/components/ui/badge';
import { TextTruncate } from '@/components/ui/text-truncate';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouseActivityStateUpdate } from '@/hooks/useWarehouseActivity';
import { toast } from 'sonner';

interface Props {
  data: WarehouseActivity[];
  meta: PaginationMeta;
  search: string;
  perPage: number;
  page: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onSearchChange: (value: string) => void;
  onPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
  onRetry: () => void;
  startDate?: string | null;
  endDate?: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onDateRangeChange?: (start: string | null, end: string | null) => void;
}

const formatDate = (value: string): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, 'dd MMMM yyyy', { locale: id });
};

export default function PengeluaranUnitTable({
  data,
  meta,
  search,
  perPage,
  page,
  isLoading,
  onSearchChange,
  onPerPageChange,
  onPageChange,
  startDate,
  endDate,
  canEdit,
  canDelete,
  onDateRangeChange,
}: Props) {
  const router = useRouter();
  const slugValue = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;
  const slug = slugValue ? String(slugValue) : '';

  const [editingActivity, setEditingActivity] = useState<{ id: string | number; state: 'draft' | 'process' | 'done'; state_note?: string } | null>(null);
  const [selectedState, setSelectedState] = useState<'draft' | 'process' | 'done'>('draft');
  const [stateNote, setStateNote] = useState('');

  const updateStateMutation = useWarehouseActivityStateUpdate();

  useEffect(() => {
    if (editingActivity?.state) {
      const s = editingActivity.state.toLowerCase();
      if (s === 'draft' || s === 'process' || s === 'done') {
        setSelectedState(s as 'draft' | 'process' | 'done');
      }
    }
    if (editingActivity?.state_note) {
      setStateNote(editingActivity.state_note);
    } else {
      setStateNote('');
    }
  }, [editingActivity]);

  const handleUpdateState = async () => {
    if (!editingActivity) return;
    try {
      await updateStateMutation.mutateAsync({
        activityId: editingActivity.id,
        state: selectedState,
        state_note: stateNote,
      });
      toast.success('Status pengeluaran berhasil diperbarui');
      setEditingActivity(null);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui status pengeluaran');
    }
  };

  const handleOpenStateDialog = (activityId: string | number, state: string, stateNote?: string) => {
    const s = state?.toLowerCase();
    const cleanState = s === 'draft' || s === 'process' || s === 'done' ? (s as 'draft' | 'process' | 'done') : 'draft';
    setEditingActivity({ id: activityId, state: cleanState, state_note: stateNote });
  };

  const resolveBasePath = (): string => {
    if (slug) {
      return `/dashboard/${slug}/warehouse/pengeluaran-unit`;
    }
    const cleanPath = router.asPath.split('?')[0];
    if (cleanPath.includes('/warehouse/pengeluaran-unit')) {
      return cleanPath.replace(/\/+$/, '');
    }
    return '/dashboard/warehouse/pengeluaran-unit';
  };

  const navigateToDetail = (id: string | number): void => {
    const base = resolveBasePath();
    void router.push(`${base}/${id}/detail`);
  };

  const columns: ColumnDef<WarehouseActivity>[] = [
    {
      header: 'NO PENGELUARAN',
      accessorKey: 'activity_number',
      alignment: 'left',
      sortable: true,
      cell: (item) => <CopyBox text={item.activity_number || '-'} />,
    },
    {
      header: 'TANGGAL',
      accessorKey: 'activity_date',
      alignment: 'left',
      sortable: true,
      cell: (item) => formatDate(item.activity_date),
    },
    {
      header: 'STATUS PENGELUARAN',
      accessorKey: 'state',
      sortable: true,
      alignment: 'left',
      cell: (item) => {
        const s = item?.state?.toLowerCase();
        let text = item?.state || '-';
        let bg = 'border-slate-200 bg-slate-50 text-slate-700';
        if (s === 'draft') {
          text = 'Draft';
          bg = 'border-slate-200 bg-slate-50 text-slate-700';
        } else if (s === 'process') {
          text = 'Proses';
          bg = 'border-amber-200 bg-amber-50 text-amber-700';
        } else if (s === 'done') {
          text = 'Selesai';
          bg = 'border-emerald-200 bg-emerald-50 text-emerald-700';
        }
        return (
          <div className="flex items-center gap-1.5">
            {canEdit && (
              <button
                onClick={() => handleOpenStateDialog(item.id, item.state || 'draft', item.state_note)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Ubah Status"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            <Badge variant="outline" className={`font-semibold ${bg}`}>
              {text}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'person.name',
      alignment: 'left',
      sortable: true,
      cell: (item) => (
        item?.person ? (
          <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${item.person?.name ?? '-'}`}>
            {item.person?.name ?? '-'}
          </ReferenceLink>
        ) : '-'
      ),
    },
    {
      header: 'KETERANGAN',
      accessorKey: 'description',
      alignment: 'left',
      sortable: true,
      cell: (item) => <TextTruncate text={item.description || '-'} maxLength={20} />,
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 hover:bg-slate-100 transition-colors duration-200 hover:scale-110 active:scale-95 transform">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
            <DropdownMenuItem
              onClick={() => navigateToDetail(item.id)}
              className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
            >
              Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canEdit}
              onClick={() => handleOpenStateDialog(item.id, item.state || 'draft', item.state_note)}
              className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
            >
              Ubah Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearchChange={onSearchChange}
        showLimitChange
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        meta={meta}
        onPageChange={onPageChange}
        addDateRangePicker={true}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />

      {/* DIALOG UPDATE STATUS */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Ubah Status Pengeluaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih status baru untuk aktivitas pengeluaran unit ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Status Baru</label>
              <Select
                value={selectedState}
                onValueChange={(val) => setSelectedState(val as 'draft' | 'process' | 'done')}
              >
                <SelectTrigger className="w-full bg-white border-slate-200 h-10 rounded-lg">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <div className="flex flex-col text-left py-1">
                      <span className="font-medium text-slate-800 text-sm">Draft (Draf)</span>
                      <span className="text-[11px] text-slate-500 font-normal">Dokumen baru dibuat dan belum diproses</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="process">
                    <div className="flex flex-col text-left py-1">
                      <span className="font-medium text-slate-800 text-sm">Process (Proses)</span>
                      <span className="text-[11px] text-slate-500 font-normal">Sedang dalam proses pengerjaan/pengeluaran barang</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="done">
                    <div className="flex flex-col text-left py-1">
                      <span className="font-medium text-slate-800 text-sm">Done (Selesai)</span>
                      <span className="text-[11px] text-slate-500 font-normal">Aktivitas pengeluaran unit telah selesai dilakukan</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Catatan Status</label>
              <Textarea
                placeholder="Masukkan catatan perubahan status..."
                value={stateNote}
                onChange={(e) => setStateNote(e.target.value)}
                className="w-full min-h-[80px] bg-white border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" className="rounded-lg" onClick={() => setEditingActivity(null)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdateState}
              disabled={updateStateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5"
            >
              {updateStateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
