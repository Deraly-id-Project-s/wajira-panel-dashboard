import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { usePermissions, usePermission } from '@/hooks/usePermission';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Shield, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Permission } from '@/@types/permission.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

export default function PermissionsPage() {
  const { data: permissions = [], isLoading } = usePermissions();

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const { data: detail, isLoading: detailLoading } = usePermission(selectedId ?? undefined);

  const filtered = useMemo(
    () => permissions.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [permissions, search],
  );

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / perPage) || 1;
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentData = useMemo(() => filtered.slice(startIndex, endIndex), [filtered, startIndex, endIndex]);

  const handleRowClick = (perm: Permission) => {
    setSelectedId(perm.id);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const columns = useMemo<ColumnDef<Permission>[]>(
    () => [
      {
        header: 'Nama Izin Akses',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Shield className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
          </div>
        ),
      },
      {
        header: 'Deskripsi',
        accessorKey: 'description',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
            {item.description || '-'}
          </Badge>
        ),
      },
      {
        header: 'Dibuat',
        accessorKey: 'created_at',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          <span className="text-sm text-slate-500">
            {item.created_at
              ? format(new Date(item.created_at), 'dd MMM yyyy', { locale: localeId })
              : '-'}
          </span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        className: 'w-[80px]',
        cell: (item) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 mx-auto"
              onClick={() => handleRowClick(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Izin Akses"
          subtitle="Daftar Izin Akses yang tersedia pada sistem"
        />

        <BaseTable
          data={currentData}
          columns={columns}
          loading={isLoading}
          search={search}
          onSearchChange={handleSearchChange}
          showLimitChange={true}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          onRowClick={handleRowClick}
          meta={{
            currentPage: page,
            perPage: perPage,
            lastPage: totalPages,
            total: totalItems,
          }}
          onPageChange={setPage}
        />
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Izin Akses</DialogTitle>
            <DialogDescription>Informasi lengkap Izin Akses yang dipilih.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ) : detail ? (
            <div className="space-y-6 py-2">
              {/* INFO */}
              <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Shield className="h-5 w-5 text-indigo-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{detail.name}</p>
                    {detail.description && (
                      <p className="text-xs text-gray-500">{detail.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Shield className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-gray-500">Guard:</span>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal text-xs">
                      {detail.guard_name || '-'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-gray-500">Dibuat:</span>
                    <span className="text-sm text-gray-700">
                      {detail.created_at
                        ? format(new Date(detail.created_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })
                        : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-gray-500">Diperbarui:</span>
                    <span className="text-sm text-gray-700">
                      {detail.updated_at
                        ? format(new Date(detail.updated_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ROLES */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-500" />
                  Hak Akses yang memiliki Izin Akses ini
                </h4>
                {detail.roles && detail.roles.length > 0 ? (
                  <div className="space-y-2">
                    {detail.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5"
                      >
                        <span className="text-sm font-medium text-gray-900">{role.name}</span>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs">
                          Aplikasi Web
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Tidak ada role yang terkait.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">Gagal memuat detail permission.</p>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}