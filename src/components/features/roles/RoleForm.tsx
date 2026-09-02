import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoleDetail, useCreateRole, useUpdateRole } from '@/hooks/useRole';
import { usePermissions } from '@/hooks/usePermission';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { useCompany } from '@/contexts/CompanyContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface RoleFormProps {
  id?: string;
}

export function RoleForm({ id }: RoleFormProps) {
  const router = useRouter();
  const { slug } = router.query;
  const { companyId } = useCompany();

  const isEditMode = !!id;

  // Hooks for queries and mutations
  const { data: role, isLoading: isLoadingRole, isError: isErrorRole } = useRoleDetail(id as string);
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const [name, setName] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  // Fetch modules and features
  const { data: modules = [], isLoading: isLoadingModules } = useQuery<any[]>({
    queryKey: ['global-modules', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await apiClient.get('/wapi/global/module', {
        params: { company_id: companyId }
      });
      return response.data?.data || [];
    },
    enabled: !!companyId,
  });

  // Fetch all permissions
  const { data: permissions = [], isLoading: isLoadingPerms } = usePermissions();

  // Pre-fill form when role data is fetched in edit mode
  useEffect(() => {
    if (isEditMode && role) {
      setName(role.name);
      setSelectedFeatures(role.features?.map((f: any) => f.id) ?? []);
      setSelectedPerms(role.permissions?.map((p: any) => p.name) ?? []);
    }
  }, [role, isEditMode]);

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

  const handleToggleAllFeaturesInModule = (mod: any, checked: boolean) => {
    const featureIds = mod.features?.map((f: any) => f.id) || [];
    if (checked) {
      setSelectedFeatures((prev) => Array.from(new Set([...prev, ...featureIds])));
    } else {
      setSelectedFeatures((prev) => prev.filter((fid) => !featureIds.includes(fid)));
    }
  };

  const handleToggleAllPermsInModule = (mod: any, checked: boolean) => {
    const matchingPermNames = getMatchingPermsForModule(mod.slug).map((p) => p.name);
    if (checked) {
      setSelectedPerms((prev) => Array.from(new Set([...prev, ...matchingPermNames])));
    } else {
      setSelectedPerms((prev) => prev.filter((name) => !matchingPermNames.includes(name)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama peran wajib diisi');
      return;
    }

    const finalFeatures = [...selectedFeatures];
    const finalPerms = [...selectedPerms];

    modules.forEach((mod, index) => {
      const isDashboardMod = mod.slug === 'dashboard' || index === 0;
      if (isDashboardMod) {
        mod.features?.forEach((f: any) => {
          if (!finalFeatures.includes(f.id)) {
            finalFeatures.push(f.id);
          }
        });
      }

      const listPermName = `${mod.slug}:list`;
      const hasListPerm = permissions.some((p) => p.name === listPermName);
      if (hasListPerm && !finalPerms.includes(listPermName)) {
        const hasCheckedFeatures = mod.features?.some((f: any) => selectedFeatures.includes(f.id) || isDashboardMod) || false;
        const hasOtherCheckedPerms = selectedPerms.some((p) => p.startsWith(`${mod.slug}:`) && p !== listPermName);
        if (hasCheckedFeatures || hasOtherCheckedPerms) {
          finalPerms.push(listPermName);
        }
      }
    });

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id as string,
          payload: {
            name,
            company_id: companyId,
            feature_ids: finalFeatures,
            permissions: finalPerms,
          },
        });
        toast.success('Role berhasil diperbarui');
      } else {
        await createMutation.mutateAsync({
          name,
          company_id: companyId,
          feature_ids: finalFeatures,
          permissions: finalPerms,
        });
        toast.success('Role berhasil dibuat');
      }
      router.push(`/dashboard/${slug}/settings/roles`);
    } catch (err: any) {
      toast.error(err?.message || `Gagal ${isEditMode ? 'memperbarui' : 'membuat'} role`);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${slug}/settings/roles`);
  };

  const isMutationPending = createMutation.isPending || updateMutation.isPending;
  const isPageLoading = isEditMode && isLoadingRole;

  if (isPageLoading) {
    return <LoadingState variant="page" />;
  }

  if (isEditMode && (isErrorRole || !role)) {
    return (
      <div className="bg-white rounded-md border p-12 text-center text-red-500 font-medium">
        Gagal memuat detail peran atau peran tidak ditemukan.
      </div>
    );
  }

  const isPending = isMutationPending || isPageLoading;

  return (
    <div className="mx-auto space-y-4 py-2 sm:space-y-6 sm:p-6">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Hak Akses', onClick: () => router.push(`/dashboard/${slug}/settings/roles`) },
          { label: isEditMode ? 'Edit' : 'Tambah Baru' }
        ]}
        title={isEditMode ? 'Ubah Peran' : 'Tambah Peran Baru'}
        subtitle={isEditMode ? 'Edit detail peran dan perbarui daftar akses fitur.' : 'Definisikan peran baru beserta hak akses fitur.'}
        onBack={handleBack}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Card: Role Name */}
        <div className="space-y-4 rounded-md border bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="text-indigo-600 h-4 w-4" />
            Informasi Utama Peran
          </h2>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Nama Peran</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: finance-supervisor"
              className="max-w-md bg-white rounded-md h-11"
              disabled={isPending || (isEditMode && role?.name?.toLowerCase() === 'admin')}
              required
            />
            <p className="text-xs text-gray-500">Gunakan format lowercase, pisahkan dengan tanda hubung (-) jika lebih dari satu kata.</p>
          </div>
        </div>

        {/* Card: Features Selection */}
        <div className="space-y-6 rounded-md border bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col items-stretch gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="text-indigo-600 h-4 w-4" />
                Fitur dan Modul
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Tentukan fitur mana saja yang dapat diakses oleh peran ini.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
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
              {modules.map((mod, index) => {
                const isDashboardMod = mod.slug === 'dashboard' || index === 0;
                const matchingPerms = getMatchingPermsForModule(mod.slug);
                const isAllFeaturesInModuleChecked = mod.features?.every((f: any) => selectedFeatures.includes(f.id)) || false;
                const isAllPermsInModuleChecked = matchingPerms.length > 0 && matchingPerms.every((p) => selectedPerms.includes(p.name));

                return (
                  <div key={mod.id} className="space-y-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:p-6">
                    {/* Module Header Group Box */}
                    <div className="border-b pb-3">
                      <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                        {mod.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Kelola fitur dan izin akses untuk modul {mod.name}.</p>
                    </div>

                    {/* Side-by-side columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Fitur */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Daftar Fitur</span>
                          <label className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer select-none">
                            <Checkbox
                              checked={isAllFeaturesInModuleChecked || isDashboardMod}
                              onCheckedChange={(checked) => handleToggleAllFeaturesInModule(mod, !!checked)}
                              className="h-3.5 w-3.5 rounded"
                              disabled={isLoadingModules || isLoadingPerms || isPending || isDashboardMod}
                            />
                            <span>Tandai Semua</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mod.features?.map((feature: any) => {
                            const isChecked = selectedFeatures.includes(feature.id) || isDashboardMod;
                            const isFeatureDisabled = isPending || isDashboardMod;

                            return (
                              <div
                                key={feature.id}
                                className={`flex flex-col justify-between p-4 rounded-xl border transition-all h-full ${isChecked
                                  ? 'border-indigo-600 bg-indigo-50/10 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/30'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <span
                                    className="text-xs font-semibold text-gray-900 leading-tight cursor-pointer select-none"
                                    onClick={() => !isDashboardMod && toggleFeature(feature)}
                                  >
                                    {feature.name}
                                  </span>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => toggleFeature(feature)}
                                    disabled={isFeatureDisabled}
                                  />
                                </div>

                                <p className="text-[11px] text-gray-500 leading-normal font-medium mt-auto">
                                  {feature.description || 'Tidak ada deskripsi.'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Izin Akses (Permissions) */}
                      <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-6">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Izin Akses (Permissions)</span>
                          {matchingPerms.length > 0 && (
                            <label className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700 cursor-pointer select-none">
                              <Checkbox
                                checked={isAllPermsInModuleChecked}
                                onCheckedChange={(checked) => handleToggleAllPermsInModule(mod, !!checked)}
                                className="h-3.5 w-3.5 rounded"
                                disabled={isLoadingModules || isLoadingPerms || isPending}
                              />
                              <span>Tandai Semua</span>
                            </label>
                          )}
                        </div>

                        {matchingPerms.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400 font-medium">
                            Tidak ada perizinan spesifik untuk modul ini.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                            {matchingPerms.map((perm) => {
                              const isListPerm = perm.name.endsWith(':list');
                              const parts = perm.name.split(':');
                              const prefix = parts[0];
                              const hasOtherChecked = selectedPerms.some((p) => p.startsWith(`${prefix}:`) && p !== perm.name);
                              const hasCheckedFeatures = mod.features?.some((f: any) => selectedFeatures.includes(f.id) || isDashboardMod) || false;
                              const isListDisabled = isListPerm && (hasOtherChecked || hasCheckedFeatures);

                              const isPermChecked = selectedPerms.includes(perm.name) || isListDisabled;
                              const isPermCheckboxDisabled = isPending || isListDisabled;

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
                                      disabled={isPermCheckboxDisabled}
                                    />
                                  </div>
                                  <div className="space-y-0.5 min-w-0">
                                    <span className="block text-xs font-mono font-bold text-indigo-950 truncate" title={perm.name}>
                                      {perm.name}
                                    </span>
                                    <span className="block text-[9px] text-gray-500 leading-normal font-medium line-clamp-2">
                                      {perm.description || 'Tidak ada deskripsi.'}
                                    </span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
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
            {isPending ? 'Menyimpan...' : (isEditMode ? 'Perbarui Peran' : 'Simpan Peran')}
          </Button>
        </div>
      </form>
    </div>
  );
}
