import { LoadingState } from '@/components/ui/loading-state';
import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { useWarehouseActivities, useWarehouseActivityStateUpdate } from '@/hooks/useWarehouseActivity';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useCompany } from '@/contexts/CompanyContext';
import { Card } from '@/components/ui/card';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { Badge } from '@/components/ui/badge';
import { TextTruncate } from '@/components/ui/text-truncate';
import { useRouter } from 'next/router';
import { Input } from '@/components/ui/input';
import { Search, Eye, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function PengeluaranSparepartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';
  const { companyId } = useCompany();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const [editingActivity, setEditingActivity] = useState<{ id: string; state: 'draft' | 'process' | 'done'; state_note?: string } | null>(null);
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

  const { data: activities, isLoading, isError, error, refetch, isFetching } = useWarehouseActivities({
    activityType: 'issue',
    type: 'sparepart',
    company_id: companyId ? Number(companyId) : null,
    perPage: 200,
  });

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('warehouse:edit') || hasPermission('warehouse:activity');

  const allData = useMemo(() => activities?.data ?? [], [activities?.data]);

  const filteredData = useMemo(() => {
    let result = allData;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate >= start;
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        if (!item.tanggal) return false;
        const itemDate = new Date(item.tanggal);
        return itemDate <= end;
      });
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) => {
        const matchNo = item.noPenerimaan?.toLowerCase().includes(lowerSearch) || item.activity_number?.toLowerCase().includes(lowerSearch);
        const matchCustomer = item.supplier?.toLowerCase().includes(lowerSearch) || item.person?.name?.toLowerCase().includes(lowerSearch);
        const matchKet = item.keterangan?.toLowerCase().includes(lowerSearch) || item.description?.toLowerCase().includes(lowerSearch);
        const matchDate = item.tanggal?.toLowerCase().includes(lowerSearch) || item.activity_date?.toLowerCase().includes(lowerSearch);
        return matchNo || matchCustomer || matchKet || matchDate;
      });
    }
    return result;
  }, [allData, search, startDate, endDate]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const columns: ColumnDef<any>[] = [
    {
      header: 'NO PENGELUARAN',
      accessorKey: 'activity_number',
      alignment: 'left',
      sortable: true,
      cell: (item) => <CopyBox text={item.activity_number || item.noPenerimaan} />,
    },
    {
      header: 'TANGGAL',
      accessorKey: 'activity_date',
      alignment: 'left',
      sortable: true,
      cell: (item) => formatDate(item.activity_date || item.tanggal),
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'person.name',
      alignment: 'left',
      sortable: true,
      cell: (item) => (
        item?.person ? (
          <ReferenceLink href={`/dashboard/${slugStr}/master/customer?search=${item.person?.name || item.supplier}`}>
            {item.person?.name || item.supplier}
          </ReferenceLink>
        ) : '-'
      ),
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
                onClick={() => setEditingActivity({ id: item.id, state: s, state_note: item.state_note })}
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
      header: 'KETERANGAN',
      accessorKey: 'description',
      alignment: 'left',
      sortable: true,
      cell: (item) => <TextTruncate text={item.description || item.keterangan || '-'} maxLength={25} />,
    },
    {
      header: 'AKSI',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/${slugStr}/warehouse/pengeluaran-sparepart/${item.id}/detail`)}
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
        >
          <Eye className="h-4 w-4 mr-1.5" /> Detail
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Pengeluaran Sparepart" subtitle="Kelola dan lacak semua data pengeluaran stock sparepart" />
          <LoadingState variant="page" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Pengeluaran Sparepart" subtitle="Kelola dan lacak semua data pengeluaran stock sparepart" />

        <Card className="rounded-md border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 max-w-md w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pengeluaran..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-10 w-full border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate || ''}
                onChange={(e) => {
                  setStartDate(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="h-10 border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm"
              />
              <span className="text-gray-500">s/d</span>
              <Input
                type="date"
                value={endDate || ''}
                onChange={(e) => {
                  setEndDate(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="h-10 border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm"
              />
            </div>
          </div>

          <BaseTable
            data={paginatedData}
            columns={columns}
            loading={isLoading || isFetching}
            page={safeCurrentPage}
            perPage={perPage}
            totalData={totalItems}
            onPageChange={setCurrentPage}
            onPerPageChange={(pp) => {
              setPerPage(pp);
              setCurrentPage(1);
            }}
          />
        </Card>
      </div>

      <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">Ubah Status Pengeluaran</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih status baru untuk aktivitas pengeluaran sparepart ini.
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="process">Proses</SelectItem>
                  <SelectItem value="done">Selesai</SelectItem>
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
              className="bg-[#1e3a5f] text-white hover:bg-[#152e4d] rounded-lg px-5"
            >
              {updateStateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
