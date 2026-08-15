import { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoleDetail } from '@/hooks/useRole';
import { useUserOptions, useAssignRole, useRevokeRole } from '@/hooks/useUser';
import { toast } from 'sonner';
import { ChevronLeft, Shield, UserPlus, UserMinus } from 'lucide-react';
import { ApiResponseError } from '@/lib/api/response';
import { LoadingState } from '@/components/ui/loading-state';

export default function RoleDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const { data: role, isLoading: isLoadingRole, isError: isErrorRole, refetch } = useRoleDetail(id as string);
  const { data: userOptions = [], isLoading: isLoadingUsers } = useUserOptions();

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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Column - Users & Management */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card: Role Info Header (Without technical stuff like guard_name) */}
              <div className="bg-white rounded-md border p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
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
                        <SelectTrigger className="bg-white border-slate-200 h-10 rounded-lg text-sm shadow-none focus:ring-slate-300">
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
                    <Button onClick={handleDispatchRole} disabled={assignRoleMutation.isPending || !selectedUserId} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
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
                  <div className="border rounded-md overflow-hidden bg-white">
                    <table className="min-w-full text-xs text-left">
                      <thead className="bg-slate-50/80 border-b">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-700 uppercase tracking-wider">Nama</th>
                          <th className="px-4 py-3 font-semibold text-gray-700 uppercase tracking-wider">Username & Email</th>
                          <th className="px-4 py-3 font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          {role.name.toLowerCase() !== 'admin' && (
                            <th className="px-4 py-3 font-semibold text-gray-700 uppercase tracking-wider text-center">Aksi</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {role.users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-medium text-gray-900">
                              <div>{user.name}</div>
                              <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                {user.firstname || ''} {user.lastname || ''}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="text-gray-700 font-medium">{user.username}</div>
                              <div className="text-gray-500 mt-0.5">{user.email}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${user.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                {user.is_active === 1 ? 'Aktif' : 'Non-aktif'}
                              </span>
                            </td>
                            {role.name.toLowerCase() !== 'admin' && (
                              <td className="px-4 py-3.5 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setUserToRevoke({ id: user.id, name: user.name })}
                                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                  title="Revoke Peran / Lepas Peran"
                                >
                                  <UserMinus size={15} />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Features & Permissions List */}
            <div className="bg-white rounded-md border p-6 shadow-sm space-y-6 h-fit max-h-[80vh] flex flex-col">
              {role.features && role.features.length > 0 && (
                <div className="space-y-3 border-b pb-4 shrink-0">
                  <h3 className="text-base font-semibold text-gray-900">Fitur yang Diaktifkan</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Daftar fitur aplikasi yang dikaitkan dengan peran ini.</p>
                  <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto">
                    {role.features.map((f) => (
                      <span key={f.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {f.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col flex-1 min-h-0">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Izin Akses (Permissions)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Daftar hak akses yang diaktifkan untuk peran ini.</p>
                </div>

                {!role.permissions || role.permissions.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50/50 rounded-md p-8 text-center border border-dashed font-medium mt-4">
                    Tidak ada izin akses yang terdaftar.
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto pr-1 flex-1 mt-4">
                    {role.permissions.map((perm) => (
                      <div key={perm.id} className="p-3 rounded-md border border-slate-100 bg-slate-50/40 flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-indigo-700">{perm.name}</span>
                        <span className="text-[11px] text-gray-500 leading-normal font-medium">{perm.description || 'Tidak ada deskripsi.'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
