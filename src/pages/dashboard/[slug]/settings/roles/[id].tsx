import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoleDetail } from '@/hooks/useRole';
import { useUserOptions, useAssignRole, useRevokeRole } from '@/hooks/useUser';
import { toast } from 'sonner';
import { ChevronLeft, Shield, UserPlus, UserMinus } from 'lucide-react';
import { ApiResponseError } from '@/lib/api/response';
import type { LaravelApiResponse } from '@/lib/api/response';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Module } from '@/services/module.service';
import type { Permission } from '@/@types/permission.types';

export default function RoleDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  const { data: role, isLoading: isLoadingRole, isError: isErrorRole, refetch } = useRoleDetail(id as string);
  const { data: userOptions = [], isLoading: isLoadingUsers } = useUserOptions();

  const userColumns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        header: 'Nama',
        accessorKey: 'name',
        className: 'font-medium text-gray-900',
        cell: (user) => (
          <div>
            <div>{user.name}</div>
            <div className="text-[10px] text-gray-400 font-normal mt-0.5">
              {user.firstname || ''} {user.lastname || ''}
            </div>
          </div>
        ),
      },
      {
        header: 'Username & Email',
        cell: (user) => (
          <div>
            <div className="text-gray-700 font-medium">{user.username}</div>
            <div className="text-gray-500 mt-0.5">{user.email}</div>
          </div>
        ),
      },
      {
        header: 'Status',
        cell: (user) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${user.is_active === 1
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
          >
            {user.is_active === 1 ? 'Aktif' : 'Non-aktif'}
          </span>
        ),
      },
    ];

    if (role?.name?.toLowerCase() !== 'admin') {
      cols.push({
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (user) => (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUserToRevoke({ id: user.id, name: user.name })}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              title="Revoke Peran / Lepas Peran"
            >
              <UserMinus size={15} />
            </Button>
          </div>
        ),
      });
    }

    return cols;
  }, [role?.name]);

  const { data: modules = [], isLoading: isLoadingModules } = useQuery<Module[]>({
    queryKey: ['global-modules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await apiClient.get<LaravelApiResponse<Module[]>>('/wapi/global/module', {
        params: { company_id: companyId }
      });
      return response.data?.data || [];
    },
    enabled: !!companyId,
  });

  const assignRoleMutation = useAssignRole();
  const revokeRoleMutation = useRevokeRole();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userToRevoke, setUserToRevoke] = useState<{ id: number | string; name: string } | null>(null);

  const handleBack = () => {
    router.push(`/dashboard/${slug}/settings/roles`);
  };

  const handleDispatchRole = async () => {
    if (!selectedUserId || !role) {
      toast.error('Pilih pengguna terlebih dahulu');
      return;
    }

    try {
      await assignRoleMutation.mutateAsync({ id: selectedUserId, role: role.name });
      toast.success(`Berhasil menambahkan peran ${role.name} ke pengguna`);
      setSelectedUserId('');
      refetch();
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal menetapkan peran';
      toast.error(message);
    }
  };

  const handleRevokeRole = async () => {
    if (!userToRevoke || !role) return;

    try {
      await revokeRoleMutation.mutateAsync({ id: userToRevoke.id, role: role.name });
      toast.success(`Berhasil melepas peran ${role.name} dari ${userToRevoke.name}`);
      setUserToRevoke(null);
      refetch();
    } catch (error) {
      const message = error instanceof ApiResponseError ? error.message : 'Gagal mencabut peran';
      toast.error(message);
    }
  };

  // Filter out users who already have this role to avoid duplicate assignment in dispatch select
  const availableUsers = userOptions.filter(
    (userOpt) => !role?.users?.some((u) => u.id === userOpt.id)
  );

  const getMatchingPermsForModule = (moduleSlug: string, rolePerms: Permission[]) => {
    return rolePerms.filter((p) => {
      const parts = p.name.split(':');
      const prefix = parts[0];

      if (moduleSlug === 'user') {
        return ['user', 'role', 'permission', 'settings'].includes(prefix) || p.name === 'user' || p.name === 'role' || p.name === 'permission' || p.name === 'settings';
      }

      return prefix === moduleSlug || p.name === moduleSlug;
    });
  };

  const modulesWithAccess = role ? modules.map((mod) => {
    const activeFeatures = role.features?.filter((roleFeature) =>
      mod.features?.some((moduleFeature) => moduleFeature.id === roleFeature.id)
    ) || [];
    const activePerms = getMatchingPermsForModule(mod.slug, role.permissions || []);
    return {
      ...mod,
      activeFeatures,
      activePerms,
    };
  }).filter((m) => m.activeFeatures.length > 0 || m.activePerms.length > 0) : [];

  return (
    <DashboardLayout>
      <div className="mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Hak Akses', onClick: () => router.push(`/dashboard/${slug}/settings/roles`) },
            { label: 'Detail' }
          ]}
          title="Detail Hak Akses"
          subtitle="Lihat informasi hak akses, kelola penugasan pengguna, dan daftar izin akses."
          onBack={handleBack}
        />

        {isLoadingRole ? (
          <LoadingState variant="page" />
        ) : isErrorRole || !role ? (
          <div className="bg-white rounded-md border p-12 text-center text-red-500 font-medium">
            Gagal memuat detail peran atau peran tidak ditemukan.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users & Management Section */}
            <div className="space-y-6">
              {/* Card: Role Info Header */}
              <div className="bg-white rounded-md border p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-orange-50 flex items-center justify-center text-orange-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 capitalize">{role.name}</h2>
                    <p className="text-xs text-gray-500">Dibuat pada: {role.created_at ? new Date(role.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Card: Users List */}
              <div className="bg-white rounded-md border p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Daftar Pengguna</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Pengguna yang saat ini memiliki peran &quot;{role.name}&quot;.</p>
                </div>

                {/* Dispatch/Assign Role UI (Not for admin role) */}
                {role.name.toLowerCase() !== 'admin' && (
                  <div className="bg-slate-50/50 p-4 rounded-md border border-slate-100 flex flex-col sm:flex-row items-end gap-3">
                    <div className="space-y-1.5 w-full sm:flex-1">
                      <label className="text-xs font-semibold text-gray-700">Dispatch Peran (Tambah Pengguna)</label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="bg-white border-slate-200 h-10 rounded-md text-sm shadow-none focus:ring-slate-300">
                          <SelectValue placeholder={isLoadingUsers ? 'Memuat pengguna...' : 'Pilih Pengguna'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {availableUsers.length === 0 ? (
                            <div className="p-2 text-center text-xs text-gray-400 font-medium">Semua pengguna sudah memiliki peran ini</div>
                          ) : (
                            availableUsers.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleDispatchRole} disabled={assignRoleMutation.isPending || !selectedUserId} className="btn-primary-orange!">
                      <UserPlus size={16} />
                      Tambah
                    </Button>
                  </div>
                )}

                {/* Table Users */}
                {!role.users || role.users.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50/50 rounded-md p-8 text-center border border-dashed font-medium">
                    Tidak ada pengguna yang terdaftar pada peran ini.
                  </div>
                ) : (
                  <BaseTable
                    data={role.users}
                    columns={userColumns}
                  />
                )}
              </div>
            </div>

            {/* Bottom Section - Features & Permissions Grouped by Module */}
            <div className="bg-white rounded-md border p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Hak Akses & Fitur (RBAC)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Daftar modul, fitur, dan perizinan spesifik yang diaktifkan untuk peran ini.</p>
              </div>

              {modulesWithAccess.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50/50 rounded-md p-8 text-center border border-dashed font-medium">
                  Tidak ada fitur atau izin akses yang aktif untuk peran ini.
                </div>
              ) : (
                <div className="space-y-6">
                  {modulesWithAccess.map((mod) => (
                    <div key={mod.id} className="border border-slate-100 rounded-xl bg-slate-50/25 p-6 space-y-4">
                      {/* Module Title */}
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{mod.name}</h4>
                      </div>

                      {/* Features Badges */}
                      {mod.activeFeatures.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fitur Aktif</span>
                          <div className="flex flex-wrap gap-2">
                            {mod.activeFeatures.map((feature) => (
                              <span key={feature.id} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">
                                {feature.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Permissions List */}
                      {mod.activePerms.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-slate-100/50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permissions</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {mod.activePerms.map((perm) => (
                              <div key={perm.id} className="p-3 rounded-md border border-slate-100 bg-white shadow-sm flex flex-col gap-1 min-w-0">
                                <span className="font-mono text-xs font-bold text-orange-950 truncate" title={perm.name}>{perm.name}</span>
                                <span className="text-[10px] text-slate-500 font-medium leading-normal line-clamp-2">{perm.description || 'Tidak ada deskripsi.'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Revoke Role Confirmation Modal */}
      <Dialog open={!!userToRevoke} onOpenChange={(open) => !open && setUserToRevoke(null)}>
        <DialogContent className="max-w-[420px] rounded-md">
          <DialogHeader>
            <DialogTitle>Lepas Peran Dari Pengguna?</DialogTitle>
            <DialogDescription className="pt-2 text-sm text-gray-500 leading-normal">
              Apakah Anda yakin ingin melepas peran <span className="font-bold text-gray-900">&quot;{role?.name}&quot;</span> dari pengguna <span className="font-bold text-gray-900">&quot;{userToRevoke?.name}&quot;</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setUserToRevoke(null)} disabled={revokeRoleMutation.isPending} className="rounded-md">
              Batal
            </Button>
            <Button onClick={handleRevokeRole} disabled={revokeRoleMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md">
              {revokeRoleMutation.isPending ? 'Memproses...' : 'Ya, Lepas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
