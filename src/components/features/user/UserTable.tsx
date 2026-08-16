import { useCallback, useMemo, useState } from 'react';
import { User } from '@/@types/user.types';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Plus, Info } from 'lucide-react';
import { useTableSort } from '@/hooks/useTableSort';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { useActivateUser, useDeactivateUser } from '@/hooks/useUser';
import { getUserPassword } from '@/services/user.service';
import { toast } from 'sonner';
import { CopyBox } from '@/components/ui/copy-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { LoadingState } from '@/components/ui/loading-state';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

interface Props {
  data: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onAdd?: () => void;
  isLoading?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserTable({ data, onEdit, onDelete, onAdd, isLoading, canCreate, canEdit, canDelete }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const router = useRouter();
  const { slug } = router.query;

  const activateMutation = useActivateUser();
  const deactivateMutation = useDeactivateUser();

  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter((user) => {
      const matchUsername = user.username?.toLowerCase().includes(lower);
      const matchName = user.name?.toLowerCase().includes(lower);
      const matchRoles = user.roles?.some((r) => r.name.toLowerCase().includes(lower));
      const matchCompanies = user.company_list?.toLowerCase().includes(lower);
      return matchUsername || matchName || matchRoles || matchCompanies;
    });
  }, [data, search]);

  const { sortedData, sortKey, sortOrder, handleSort } = useTableSort({
    data: filteredData,
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(() => sortedData.slice(startIndex, endIndex), [sortedData, startIndex, endIndex]);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleToggleStatus = useCallback(async (user: User, checked: boolean) => {
    try {
      if (checked) {
        await activateMutation.mutateAsync(user.id);
        toast.success(`User ${user.name} berhasil diaktifkan`);
      } else {
        await deactivateMutation.mutateAsync(user.id);
        toast.success(`User ${user.name} berhasil dinonaktifkan`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengubah status user');
    }
  }, [activateMutation, deactivateMutation]);

  const [fetchingPasswordId, setFetchingPasswordId] = useState<number | string | null>(null);

  const handleCopyPassword = useCallback(async (userId: number | string) => {
    setFetchingPasswordId(userId);
    try {
      const password = await getUserPassword(userId);
      await navigator.clipboard.writeText(password);
      toast.success('Password berhasil disalin ke clipboard');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyalin password');
    } finally {
      setFetchingPasswordId(null);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        header: 'Username',
        accessorKey: 'username',
        sortable: true,
        alignment: 'left',
        className: 'w-[20%]',
        cell: (item) => <CopyBox text={item.username || '-'} />,
      },
      {
        header: 'Email',
        accessorKey: 'email',
        sortable: true,
        alignment: 'left',
        className: 'w-[20%]',
        cell: (item) => <CopyBox text={item.email || '-'} />,
      },
      {
        header: 'Nama Pengguna',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
        className: 'w-[25%]',
      },
      {
        header: 'Perusahaan',
        accessorKey: 'company_list',
        alignment: 'left',
        cell: (item) => {
          if (!item.company_list) return '-';
          const list = item.company_list.split(',').map((name) => name.trim()).filter(Boolean);
          if (list.length === 0) return '-';
          return (
            <div className="flex flex-wrap gap-1.5 items-center">
              {list.map((name) => (
                <Badge key={name} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal py-0.5 px-2 text-[11px] rounded-md">
                  {name}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        header: 'Hak Akses',
        alignment: 'left',
        cell: (item) => item.roles && item.roles.length > 0 ? (
          <ReferenceLink href={`/dashboard/${slug}/settings/roles?search=${item.roles?.map((r) => r.name).join(',')}`}>
            {item.roles?.map((r) => r.name).join(', ')}
          </ReferenceLink>
        ) : (
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 font-normal py-0.5 px-2 text-[11px] rounded-md">Belum ditambahkan</Badge>
        ),
      },
      {
        header: 'Status',
        alignment: 'center',
        className: 'w-[160px]',
        cell: (item) => {
          const isActive = item.isActive === true || item.isActive === 1;
          const isActivating = activateMutation.isPending && activateMutation.variables === item.id;
          const isDeactivating = deactivateMutation.isPending && deactivateMutation.variables === item.id;
          const isUpdating = isActivating || isDeactivating;
          const isAdmin = Boolean(item?.roles?.some((r) => r.name.toLowerCase() === 'admin'));

          if (isUpdating) {
            return (
              <div className="flex items-center justify-center gap-2">
                <LoadingState variant="inline" text={null} />
                <span className="text-xs font-medium text-slate-400 italic">Memproses...</span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center gap-2">
              {!isActive && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help text-orange-500 hover:text-orange-700 transition-colors flex items-center shrink-0">
                        <Info className="h-3.5 w-3.5 mr-0.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs bg-slate-900 text-white rounded-lg p-2 text-xs shadow-md">
                      Akun ini non-aktif, pengguna tidak bisa menggunakan akun ini untuk login ke Dashboard
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => handleToggleStatus(item, checked)}
                disabled={activateMutation.isPending || deactivateMutation.isPending || !canEdit || isAdmin}
              />
              <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          );
        },
      },
      {
        header: 'Action',
        alignment: 'center',
        sticky: 'right',
        className: 'w-[80px]',
        cell: (item) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 mx-auto">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleCopyPassword(item.id)}
                  disabled={!canEdit || fetchingPasswordId !== null}
                  className="rounded-lg px-3 py-2 text-sm cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  {fetchingPasswordId === item.id ? 'Menyalin...' : 'Salin Password'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  disabled={!canDelete}
                  className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete, activateMutation.isPending, deactivateMutation.isPending, activateMutation.variables, deactivateMutation.variables, handleToggleStatus, fetchingPasswordId, handleCopyPassword, canEdit, canDelete, slug]
  );

  const headerActions = useMemo(
    () =>
      onAdd ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={canCreate ? onAdd : () => { }} disabled={!canCreate} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Data
          </Button>
        </div>
      ) : undefined,
    [onAdd, canCreate]
  );

  return (
    <BaseTable
      data={currentData}
      columns={columns}
      search={search}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      showLimitChange={true}
      perPage={itemsPerPage}
      onPerPageChange={handleItemsPerPageChange}
      sortBy={sortKey || undefined}
      sortDirection={sortOrder || undefined}
      onSortChange={(key) => handleSort(key as any)}
      headerActions={headerActions}
      meta={{
        currentPage,
        perPage: itemsPerPage,
        lastPage: totalPages,
        total: filteredData.length,
      }}
      onPageChange={setCurrentPage}
    />
  );
}
