import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';
import {
  clearCachedPreferences,
  getPreferences,
  PreferenceItem,
  PreferenceValue,
  updatePreference,
} from '@/services/preference.service';

const isBooleanLike = (value: unknown) => {
  if (typeof value === 'boolean') return true;
  if (typeof value !== 'string') return false;
  return ['true', 'false', '1', '0'].includes(value.toLowerCase());
};

const getValueType = (value: unknown) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const parseDraftValue = (draft: string, originalValue: PreferenceValue): PreferenceValue => {
  if (typeof originalValue === 'number') {
    const parsed = Number(draft);
    return Number.isNaN(parsed) ? originalValue : parsed;
  }

  if (originalValue === null) {
    return draft.trim() === '' ? null : draft;
  }

  if (typeof originalValue === 'object') {
    return JSON.parse(draft) as PreferenceValue;
  }

  return draft;
};

const upsertPreference = (
  preferences: PreferenceItem[] | undefined,
  key: string,
  value: PreferenceValue,
) => {
  const nextPreference = { key, value };
  if (!preferences) return [nextPreference];

  const existingIndex = preferences.findIndex((item) => item.key === key);
  if (existingIndex < 0) return [...preferences, nextPreference];

  return preferences.map((item, index) => (
    index === existingIndex ? { ...item, value } : item
  ));
};

export function PreferencePage() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();
  const preferenceQueryKey = useMemo(() => ['settings', 'preference', companyId], [companyId]);
  const [search, setSearch] = useState('');
  const [selectedPreference, setSelectedPreference] = useState<PreferenceItem | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftBooleanValue, setDraftBooleanValue] = useState(false);

  const { data: preferences = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: preferenceQueryKey,
    queryFn: () => getPreferences(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: PreferenceValue }) => updatePreference(companyId as string, key, value),
    onSuccess: (updatedPreferences, variables) => {
      queryClient.setQueryData<PreferenceItem[]>(preferenceQueryKey, (current) => {
        if (updatedPreferences.length > 0) return updatedPreferences;
        return upsertPreference(current, variables.key, variables.value);
      });
      toast.success('Preferensi berhasil diperbarui');
      setSelectedPreference(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal memperbarui preferensi');
    },
  });

  const filteredPreferences = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return preferences;

    return preferences.filter((preference) => {
      return (
        preference.key.toLowerCase().includes(keyword) ||
        (preference.description ?? '').toLowerCase().includes(keyword) ||
        formatValue(preference.value).toLowerCase().includes(keyword)
      );
    });
  }, [preferences, search]);

  const openEditDialog = (preference: PreferenceItem) => {
    setSelectedPreference(preference);
    setDraftValue(formatValue(preference.value));
    setDraftBooleanValue(
      preference.value === true ||
      (typeof preference.value === 'string' && ['true', '1'].includes(preference.value.toLowerCase())),
    );
  };

  const handleSave = () => {
    if (!selectedPreference) return;
    if (!companyId) {
      toast.error('Pilih perusahaan terlebih dahulu');
      return;
    }

    try {
      const value = isBooleanLike(selectedPreference.value)
        ? draftBooleanValue
        : parseDraftValue(draftValue, selectedPreference.value);

      updateMutation.mutate({
        key: selectedPreference.key,
        value,
      });
    } catch {
      toast.error('Format JSON tidak valid');
    }
  };

  const columns = useMemo<ColumnDef<PreferenceItem>[]>(
    () => [
      {
        header: 'Deskripsi',
        accessorKey: 'description',
        sortable: true,
        cell: (item) => (
          <span className="line-clamp-2 max-w-[420px] whitespace-pre-wrap text-sm text-slate-600">
            {item.description || '-'}
          </span>
        ),
      },
      {
        header: 'Subject',
        accessorKey: 'value',
        cell: (item) => (
          <div className="flex max-w-[520px] flex-col gap-1">
            <span className="line-clamp-2 whitespace-pre-wrap text-sm text-slate-600">
              {formatValue(item.value) || '-'}
            </span>
          </div>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        className: 'w-[80px]',
        cell: (item) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mx-auto text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => openEditDialog(item)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit preferensi</span>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferensi"
        subtitle="Daftar preferensi aplikasi dan pengaturan yang dapat diperbarui."
        actions={(
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (companyId) clearCachedPreferences(companyId);
              void refetch();
            }}
            disabled={isRefetching || !companyId}
          >
            <RefreshCw className={isRefetching ? 'animate-spin' : undefined} />
            Muat Ulang
          </Button>
        )}
      />

      <BaseTable
        data={filteredPreferences}
        columns={columns}
        loading={isLoading}
        search={search}
        onSearchChange={setSearch}
        defaultSort={{ key: 'key', direction: 'asc' }}
        getRowId={(item) => item.key}
      />

      <Dialog open={Boolean(selectedPreference)} onOpenChange={(open) => !open && setSelectedPreference(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Preferensi</DialogTitle>
            <DialogDescription>
              {selectedPreference?.key}
            </DialogDescription>
          </DialogHeader>

          {selectedPreference && (
            <div className="space-y-2">
              <Label htmlFor="preference-value">Value</Label>
              {isBooleanLike(selectedPreference.value) ? (
                <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-700">
                    {draftBooleanValue ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <Switch
                    id="preference-value"
                    checked={draftBooleanValue}
                    onCheckedChange={setDraftBooleanValue}
                  />
                </div>
              ) : (
                <Textarea
                  id="preference-value"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  className="min-h-32 font-mono text-sm"
                />
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isPending || !companyId}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
