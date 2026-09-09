import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { useRoles, useDeleteRole } from '@/hooks/useRole';
import { Role } from '@/@types/role.types';
import { toast } from 'sonner';
import { Plus, MoreVertical, CircleAlert } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ApiResponseError } from '@/lib/api/response';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';

export default function RolesPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { data: roles = [], isLoading } = useRoles();
  const deleteMutation = useDeleteRole();

  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Delete State
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteMutation.mutateAsync(roleToDelete.id);
      toast.success('Role berhasil dihapus');
      setRoleToDelete(null);
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menghapus role';
      toast.error(message);
    }
  };

  const handleAdd = useCallback(() => {
    router.push(`/dashboard/${slug}/settings/roles/create`);
  }, [router, slug]);

  const handleEdit = useCallback((role: Role) => {
    router.push(`/dashboard/${slug}/settings/roles/${role.id}/edit`);
  }, [router, slug]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(() => filteredData.slice(startIndex, endIndex), [filteredData, startIndex, endIndex]);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        header: 'Nama',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item?.name} />
      },
      {
        header: 'Akses',
        sortable: true,
        alignment: 'left',
        cell: () => 'Aplikasi Web'
      },
      {
        header: 'Pengguna',
        accessorKey: 'users_count',
        sortable: true,
        alignment: 'left',
        cell: (item) => (item as any).users_count + ' Pengguna',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 mx-auto p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                onClick={() => router.push(`/dashboard/${slug}/settings/roles/${item.id}`)}
              >
                Lihat Detail
              </DropdownMenuItem>

              {item.name.toLowerCase() !== 'admin' && (
                <>
                  <DropdownMenuItem
                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                    onClick={() => handleEdit(item)}
                  >
                    Atur Permissions
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                    onClick={() => setRoleToDelete(item)}
                  >
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [slug, handleEdit, router]
  );

  const headerActions = useMemo(
    () => (
      <Button onClick={handleAdd} disabled={isLoading} className="btn-primary-orange!">
        <Plus size={16} className="mr-2" />
        Tambah Role
      </Button>
    ),
    [isLoading, handleAdd]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 grid grid-cols-1">
        <PageHeader
          title="Hak Akses"
          subtitle="Kelola Hak dan Izin Akses."
        />

        <BaseTable
          data={currentData}
          columns={columns}
          loading={isLoading}
          search={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          showLimitChange={true}
          perPage={itemsPerPage}
          onPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          meta={{
            currentPage,
            perPage: itemsPerPage,
            lastPage: totalPages,
            total: totalItems,
          }}
          onPageChange={setCurrentPage}
          headerActions={headerActions}
        />
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent className="max-w-[440px] rounded-[28px] border-0 p-0 shadow-2xl">
          <div className="px-8 pb-8 pt-10 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-red-500/90 text-red-500">
              <CircleAlert className="h-12 w-12" strokeWidth={2.5} />
            </div>

            <AlertDialogHeader className="mt-8 space-y-4 text-center">
              <AlertDialogTitle className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
                Hapus peran ini?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-lg leading-8 text-slate-500">
                Peran &quot;{roleToDelete?.name}&quot; yang dihapus tidak bisa dikembalikan lagi.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-8 flex-col gap-3 sm:flex-col">
              <AlertDialogAction
                className="h-14 rounded-md bg-[#1F3B5B] text-lg font-semibold text-white hover:bg-[#1B3450]"
                onClick={handleDeleteRole}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya'}
              </AlertDialogAction>
              <AlertDialogCancel className="h-14 rounded-md border-slate-200 text-lg font-semibold text-slate-950 shadow-none hover:bg-slate-50">
                Tidak
              </AlertDialogCancel>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
