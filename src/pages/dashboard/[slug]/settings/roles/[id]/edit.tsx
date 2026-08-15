import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoleDetail, useUpdateRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermission';
import { toast } from 'sonner';
import { ChevronLeft, Shield } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export default function EditRolePage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  const { data: role, isLoading: isLoadingRole, isError: isErrorRole } = useRoleDetail(id as string);
  const updateMutation = useUpdateRole();

  const [name, setName] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Fetch modules and features
  const { data: modules = [], isLoading: isLoadingModules } = useQuery<any[]>({
    queryKey: ['global-modules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await apiClient.get('/wapi/global/modules', {
        params: { company_id: companyId }
      });
      return response.data?.data || [];
    },
    enabled: !!companyId,
  });

  // Fetch all permissions
  const { data: permissions = [], isLoading: isLoadingPerms } = usePermissions();

  // Pre-fill form when role data is fetched
  useEffect(() => {
    if (role) {
      setName(role.name);
      setSelectedFeatures(role.features?.map((f: any) => f.id) ?? []);
      setSelectedPerms(role.permissions?.map((p: any) => p.name) ?? []);
    }
  }, [role]);

  const toggleFeature = (feature: any) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature.id) ? prev.filter((f) => f !== feature.id) : [...prev, feature.id]
    );
  };

  const togglePerm = (permName: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSelectAll = () => {
    const allIds = modules.flatMap((mod) => mod.features?.map((f: any) => f.id) || []);
    setSelectedFeatures(allIds);
    setSelectedPerms(permissions.map((p) => p.name));
  };

  const handleClearAll = () => {
    setSelectedFeatures([]);
    setSelectedPerms([]);
  };

  const getMatchingPermsForModule = (moduleSlug: string) => {
    return permissions.filter((p) => {
      const parts = p.name.split(':');
      const prefix = parts[0];
      
      if (moduleSlug === 'user') {
        return ['user', 'role', 'permission', 'settings'].includes(prefix) || p.name === 'user' || p.name === 'role' || p.name === 'permission' || p.name === 'settings';
      }
      
      return prefix === moduleSlug || p.name === moduleSlug;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama peran wajib diisi');
      return;
    }
    if (!id) return;

    try {
      await updateMutation.mutateAsync({
        id: id as string,
        payload: {
          name,
          company_id: companyId,
          feature_ids: selectedFeatures,
          permissions: selectedPerms,
        },
      });
      toast.success('Role berhasil diperbarui');
      router.push(`/dashboard/${slug}/settings/roles`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui role');
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${slug}/settings/roles`);
  };

  if (isLoadingRole) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (isErrorRole || !role) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-md border p-12 text-center text-red-500 font-medium">
          Gagal memuat detail peran atau peran tidak ditemukan.
        </div>
      </DashboardLayout>
    );
  }

  const isPending = updateMutation.isPending || isLoadingRole;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Hak Akses', onClick: () => router.push(`/dashboard/${slug}/settings/roles`) },
            { label: 'Edit' }
          ]}
          title="Ubah Peran"
          subtitle="Edit detail peran dan perbarui daftar akses fitur."
          onBack={handleBack}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Role Name */}
          <div className="bg-white rounded-md border p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="text-indigo-600 h-4 w-4" />
              Informasi Utama Peran
            </h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nama Peran</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: finance-supervisor"
                className="max-w-md bg-white rounded-md h-11"
                disabled={isPending || role?.name?.toLowerCase() === 'admin'}
                required
              />
              <p className="text-xs text-gray-500">Gunakan format lowercase, pisahkan dengan tanda hubung (-) jika lebih dari satu kata.</p>
            </div>
          </div>

          {/* Card: Features Selection */}
          <div className="bg-white rounded-md border p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="text-indigo-600 h-4 w-4" />
                  Fitur dan Modul (RBAC)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Tentukan fitur mana saja yang dapat diakses oleh peran ini.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoadingModules || isLoadingPerms || isPending}
                  className="rounded-lg text-xs"
                >
                  Pilih Semua
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isLoadingModules || isLoadingPerms || isPending}
                  className="rounded-lg text-xs"
                >
                  Hapus Pilihan
                </Button>
              </div>
            </div>

            {isLoadingModules || isLoadingPerms ? (
              <LoadingState variant="page" />
            ) : modules.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 font-medium">Tidak ada fitur tersedia untuk perusahaan ini.</div>
            ) : (
              <div className="space-y-8">
                {modules.map((mod) => {
                  const matchingPerms = getMatchingPermsForModule(mod.slug);
                  
                  return (
                    <div key={mod.id} className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                        {mod.name}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mod.features?.map((feature: any) => {
                          const isChecked = selectedFeatures.includes(feature.id);

                          return (
                            <div
                              key={feature.id}
                              className={`flex flex-col justify-between p-4 rounded-xl border transition-all h-full min-h-[110px] ${isChecked
                                ? 'border-indigo-600 bg-indigo-50/10 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <span
                                  className="text-xs font-semibold text-gray-900 leading-tight cursor-pointer select-none"
                                  onClick={() => toggleFeature(feature)}
                                >
                                  {feature.name}
                                </span>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleFeature(feature)}
                                  disabled={isPending}
                                />
                              </div>
                              
                              <p className="text-[11px] text-gray-500 leading-normal font-medium mt-auto">
                                {feature.description || 'Tidak ada deskripsi.'}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Permissions list under this module's features grid */}
                      {matchingPerms.length > 0 && (
                        <div className="pt-4 border-t border-gray-100/80 space-y-3">
                          <div>
                            <span className="block text-[11px] uppercase font-bold tracking-wider text-gray-400">Permissions - {mod.name}</span>
                            <p className="text-[10px] text-gray-500 mt-0.5">Tentukan perizinan spesifik untuk modul ini.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {matchingPerms.map((perm) => {
                              const isPermChecked = selectedPerms.includes(perm.name);
                              return (
                                <label
                                  key={perm.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isPermChecked
                                    ? 'border-indigo-600/30 bg-indigo-50/20'
                                    : 'border-gray-100 bg-gray-50/20 hover:bg-gray-50/60'
                                    }`}
                                >
                                  <div className="pt-0.5">
                                    <Checkbox
                                      checked={isPermChecked}
                                      onCheckedChange={() => togglePerm(perm.name)}
                                      disabled={isPending}
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="block text-xs font-mono font-bold text-indigo-950">
                                      {perm.name}
                                    </span>
                                    <span className="block text-[10px] text-gray-500 leading-normal font-medium">
                                      {perm.description || 'Tidak ada deskripsi.'}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isPending}
              className="h-11 px-6 rounded-md text-slate-800 border-slate-200"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="h-11 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all"
            >
              {isPending ? 'Menyimpan...' : 'Perbarui Peran'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
