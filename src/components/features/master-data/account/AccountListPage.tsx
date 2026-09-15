import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AccountTable } from '@/components/features/account/AccountTable';
import { AccountImportModal } from '@/components/features/account/AccountImportModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchPagination } from '@/components/ui/search-pagination';
import { useAccounts, useDeleteAccount, useBulkUpdateAccounts } from '@/hooks/useAccount';
import { useAccountGroups } from '@/hooks/useAccountGroup';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { Account } from '@/@types/account.types';
import type { AccountGroup } from '@/@types/account-group.types';
import { ACCOUNT_CATEGORY_OPTIONS } from '@/lib/account';
import { ApiResponseError } from '@/lib/api/response';
import { toast } from 'sonner';
import { CircleAlert, Download, PencilLine, Plus, Upload } from 'lucide-react';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';

type BulkFormValues = {
  accountGroupId: string;
  category: string;
};

const initialBulkFormValues: BulkFormValues = {
  accountGroupId: '',
  category: '',
};

export const AccountListPage = () => {
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const { hasPermission, canManageMasterDataLock } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');
  const { page, perPage, search, getParam, setPage, setPerPage, setSearch, updateQuery } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);
  const accountGroupId = getParam('account_group_id', '');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const { data: filterGroupsData, isLoading: isLoadingFilterGroups } = useAccountGroups({
    page: 1,
    perPage: 500,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId,
  });
  const filterAccountGroups = useMemo(() => filterGroupsData?.data ?? [], [filterGroupsData?.data]);

  const { data, isLoading, isError, isFetching } = useAccounts({
    page,
    perPage,
    search,
    account_group_id: accountGroupId || undefined,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId,
  });

  const bulkUpdateMutation = useBulkUpdateAccounts();
  const deleteMutation = useDeleteAccount();
  const router = useRouter();

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openImport, setOpenImport] = useState(false);
  const [openBulkUpdate, setOpenBulkUpdate] = useState(false);
  const [openBulkConfirm, setOpenBulkConfirm] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkFormValues>(initialBulkFormValues);

  // Group Account search and scroll pagination state
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(1);
  const [accumulatedGroups, setAccumulatedGroups] = useState<AccountGroup[]>([]);

  const { data: accountGroupsData, isLoading: isLoadingGroups } = useAccountGroups({
    page: groupPage,
    perPage: 20, // Load 20 groups per request
    search: groupSearch,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId && openBulkUpdate,
  });

  // Reset pagination state when bulk update modal is closed
  useEffect(() => {
    if (!openBulkUpdate) {
      setGroupSearch('');
      setGroupPage(1);
      setAccumulatedGroups([]);
    }
  }, [openBulkUpdate]);

  // Accumulate groups
  useEffect(() => {
    if (accountGroupsData?.data && openBulkUpdate) {
      setAccumulatedGroups((prev) => {
        if (groupPage === 1) {
          return accountGroupsData.data;
        }
        const existingIds = new Set(prev.map((g) => g.id));
        const newItems = accountGroupsData.data.filter((g) => !existingIds.has(g.id));
        return [...prev, ...newItems];
      });
    }
  }, [accountGroupsData, groupPage, openBulkUpdate]);

  const hasMoreGroups = accountGroupsData ? groupPage < accountGroupsData.meta.lastPage : false;

  const handleGroupSearch = useCallback((query: string) => {
    setGroupSearch(query);
    setGroupPage(1);
    setAccumulatedGroups([]);
  }, []);

  const handleLoadMoreGroups = useCallback(() => {
    if (hasMoreGroups) {
      setGroupPage((prev) => prev + 1);
    }
  }, [hasMoreGroups]);

  const accountGroups = accumulatedGroups;
  const groupOptions = useMemo(
    () =>
      accountGroups.map((group) => ({
        value: String(group.id),
        label: group.code ? `${group.code} - ${group.name}` : group.name || String(group.id),
        subtitle: group.description ?? undefined,
      })),
    [accountGroups],
  );
  const accounts = data?.data;
  const accountRows = accounts ?? [];

  useEffect(() => {
    const availableIds = new Set((accounts ?? []).map((item) => String(item.id)));
    setSelectedIds((previous) => new Set(Array.from(previous).filter((id) => availableIds.has(id))));
  }, [accounts]);

  const resetBulkForm = () => {
    setBulkForm(initialBulkFormValues);
  };

  const handleAdd = () => {
    if (canCreate) {
      const basePath = router.query.slug ? `/dashboard/${router.query.slug}/master/account` : '/master-data/account';
      router.push(`${basePath}/create`);
    }
  };

  const handleEdit = (account: Account) => {
    if (canEdit) {
      const basePath = router.query.slug ? `/dashboard/${router.query.slug}/master/account` : '/master-data/account';
      router.push(`${basePath}/${account.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (canDelete) {
      if (!selectedAccount) return;

      try {
        await deleteMutation.mutateAsync(selectedAccount.id);
        toast.success('Data akun berhasil dihapus');
        setSelectedIds((previous) => {
          const next = new Set(previous);
          next.delete(String(selectedAccount.id));
          return next;
        });
        setTimeout(() => {
          document.body.style.pointerEvents = 'auto';
        }, 100);
      } catch (error) {
        const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus akun';
        toast.error(message);
      } finally {
        setSelectedAccount(null);
      }
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    const currentPageIds = accountRows.map((item) => String(item.id));

    setSelectedIds((previous) => {
      const next = new Set(previous);
      currentPageIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const handleOpenBulkUpdate = () => {
    if (selectedIds.size === 0) {
      toast.error('Pilih akun terlebih dahulu');
      return;
    }

    const selectedRows = accountRows.filter((account) => selectedIds.has(String(account.id)));
    if (!canManageMasterDataLock && selectedRows.some((account) => account.is_lock)) {
      toast.error('Akun terkunci hanya bisa diperbarui lewat form edit deskripsi');
      return;
    }

    resetBulkForm();
    setOpenBulkUpdate(true);
  };

  const handleBulkUpdateRequest = () => {
    if (!bulkForm.accountGroupId) {
      toast.error('Grup akun wajib dipilih');
      return;
    }

    if (!bulkForm.category) {
      toast.error('Kategori laporan wajib dipilih');
      return;
    }

    setOpenBulkConfirm(true);
  };

  const handleBulkUpdateConfirm = async () => {
    if (!bulkForm.accountGroupId || !bulkForm.category) return;

    const selectedRows = accountRows.filter((account) => selectedIds.has(String(account.id)));

    if (selectedRows.length === 0) {
      toast.error('Akun terpilih tidak ditemukan pada halaman ini');
      setOpenBulkConfirm(false);
      setOpenBulkUpdate(false);
      return;
    }

    setBulkSubmitting(true);

    try {
      const accountIds = selectedRows.map((account) => account.id);
      await bulkUpdateMutation.mutateAsync({
        accountIds,
        accountGroupId: Number(bulkForm.accountGroupId),
        category: bulkForm.category,
      });

      toast.success(`${selectedRows.length} akun berhasil diperbarui`);
      setOpenBulkConfirm(false);
      setOpenBulkUpdate(false);
      setSelectedIds(new Set());
      resetBulkForm();
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal memperbarui akun terpilih';
      toast.error(message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleExport = () => {
    if (accountRows.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const headers = ['Kode Akun', 'Nama Akun', 'Grup Akun', 'Kategori Akun', 'Deskripsi'];
    const rows = accountRows.map((account) => [
      account.code,
      account.name,
      account.accountGroupCode ?? '-',
      ACCOUNT_CATEGORY_OPTIONS.find((item) => item.value === account.category)?.label ?? account.category ?? '-',
      account.description ?? '-',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `akun-page-${page}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Akun"
          subtitle="Kelola akun finance dengan mudah"
        />

        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search here"
          searchAriaLabel="Cari akun"
          filters={
            <div className="w-full sm:w-[220px]">
              <Select
                value={accountGroupId || 'all'}
                onValueChange={(val) => {
                  updateQuery({
                    account_group_id: val === 'all' ? undefined : val,
                    page: 1,
                  });
                }}
              >
                <SelectTrigger className="h-9 w-full rounded-md border-slate-200 bg-white text-sm shadow-none cursor-pointer" aria-label="Filter Grup Akun">
                  <SelectValue placeholder={isLoadingFilterGroups ? 'Memuat grup...' : 'Semua Grup Akun'} />
                </SelectTrigger>
                <SelectContent showSearch searchPlaceholder="Cari grup akun...">
                  <SelectItem value="all">Semua Grup Akun</SelectItem>
                  {filterAccountGroups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.code ? `${group.code} - ${group.name}` : group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
          page={page}
          perPage={perPage}
          total={data?.meta.total}
          lastPage={data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          actions={
            <>
              {(search || accountGroupId) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    updateQuery({ search: undefined, account_group_id: undefined, page: 1 });
                  }}
                  className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                >
                  Reset
                </Button>
              )}
              <Button onClick={handleExport} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {canCreate && (
                <>
                  <Button onClick={() => setOpenImport(true)} variant="outline" className="h-9 text-xs px-3 rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button onClick={handleAdd} className="btn-primary!">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </>
              )}
            </>
          }
        >
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" className="h-10 rounded-md border-gray-200 px-4 text-sm font-medium text-slate-800 shadow-none hover:bg-slate-50" onClick={handleOpenBulkUpdate}>
                <PencilLine className="mr-1.5 h-4 w-4" />
                Update
              </Button>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{selectedIds.size} Akun Terpilih</span>
                <span className="text-base text-emerald-500">✓</span>
              </div>
            </div>
          )}

          {isError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-base text-red-600">
              Gagal memuat data akun.
            </div>
          ) : (
            <AccountTable
              data={accountRows}
              isLoading={isLoading || isFetching}
              canEdit={canEdit}
              canDelete={canDelete}
              canManageLock={canManageMasterDataLock}
              selectedIds={selectedIds}
              onToggleAll={toggleAll}
              onToggleRow={toggleRow}
              onEdit={handleEdit}
              onDelete={setSelectedAccount}
            />
          )}
        </SearchPagination>
      </div>

      <AlertDialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <AlertDialogContent className="max-w-[440px] rounded-[28px] border-0 p-0 shadow-2xl">
          <div className="px-8 pb-8 pt-10 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-red-500/90 text-red-500">
              <CircleAlert className="h-12 w-12" strokeWidth={2.5} />
            </div>

            <AlertDialogHeader className="mt-8 space-y-4 text-center">
              <AlertDialogTitle className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
                Hapus data akun ini?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg leading-8 text-slate-500">
                Data akun yang dihapus tidak bisa dikembalikan lagi.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-8 flex-col gap-3 sm:flex-col">
              <AlertDialogAction className="h-14 rounded-md bg-[#1F3B5B] text-lg font-semibold text-white hover:bg-[#1B3450]" onClick={handleDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya'}
              </AlertDialogAction>
              <AlertDialogCancel className="h-14 rounded-md border-slate-200 text-lg font-semibold text-slate-950 shadow-none hover:bg-slate-50">
                Tidak
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>



      <Dialog open={openBulkUpdate} onOpenChange={(open) => {
        setOpenBulkUpdate(open);
        if (!open) {
          resetBulkForm();
        }
      }}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[28px] border-0 p-0 shadow-2xl sm:max-w-[560px]" showCloseButton={false}>
          <div className="px-6 pb-6 pt-8 sm:px-9">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">Ubah Data Akun Transasaksi</DialogTitle>
              <DialogDescription className="text-lg text-slate-500">Ubah detail akun dengan cepat dan mudah</DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-6">
              <div className="space-y-2.5">
                <label className="block text-base font-semibold text-slate-900">Grup Akun</label>
                <SearchableSelect
                  value={bulkForm.accountGroupId}
                  onChange={(value) => setBulkForm((previous) => ({ ...previous, accountGroupId: value }))}
                  options={groupOptions}
                  placeholder={isLoadingGroups ? 'Memuat...' : 'Select an item'}
                  searchPlaceholder="Cari grup akun..."
                  emptyText="Grup akun tidak ditemukan."
                  loading={isLoadingGroups}
                  onSearchChange={handleGroupSearch}
                  onLoadMore={handleLoadMoreGroups}
                  hasMore={hasMoreGroups}
                  className="h-14 rounded-md border-slate-200 px-4 text-base shadow-none focus:ring-slate-300 bg-white"
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-base font-semibold text-slate-900">Kategori Laporan</label>
                <Select value={bulkForm.category} onValueChange={(value) => setBulkForm((previous) => ({ ...previous, category: value }))}>
                  <SelectTrigger className="h-14 rounded-md border-slate-200 px-4 text-base shadow-none focus:ring-slate-300">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button className="h-14 rounded-md bg-[#1F3B5B] text-lg font-semibold text-white hover:bg-[#1B3450]" onClick={handleBulkUpdateRequest}>
                Simpan
              </Button>
              <Button variant="outline" className="h-14 rounded-md border-slate-200 text-lg font-semibold text-slate-950 shadow-none hover:bg-slate-50" onClick={() => setOpenBulkUpdate(false)}>
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openBulkConfirm} onOpenChange={setOpenBulkConfirm}>
        <AlertDialogContent className="max-w-[440px] rounded-[28px] border-0 p-0 shadow-2xl">
          <div className="px-8 pb-8 pt-10 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-red-500/90 text-red-500">
              <CircleAlert className="h-12 w-12" strokeWidth={2.5} />
            </div>

            <AlertDialogHeader className="mt-8 space-y-4 text-center">
              <AlertDialogTitle className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
                Proses ini akan merubah seluruh data
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg leading-8 text-slate-500">
                Apakah kamu yakin untuk mengubah group dan akun?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-8 flex-col gap-3 sm:flex-col">
              <AlertDialogAction className="h-14 rounded-md bg-[#1F3B5B] text-lg font-semibold text-white hover:bg-[#1B3450]" onClick={handleBulkUpdateConfirm} disabled={bulkSubmitting}>
                {bulkSubmitting ? 'Menyimpan...' : 'Ya'}
              </AlertDialogAction>
              <AlertDialogCancel className="h-14 rounded-md border-slate-200 text-lg font-semibold text-slate-950 shadow-none hover:bg-slate-50" disabled={bulkSubmitting}>
                Tidak
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AccountImportModal open={openImport} onOpenChange={setOpenImport} companyId={companyId ?? ''} />
    </DashboardLayout>
  );
};
