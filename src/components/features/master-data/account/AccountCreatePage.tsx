import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AccountForm } from './AccountForm';
import { accountSchema, type AccountFormValues } from '@/scheme/account-master.schema';
import { useAccountGroups } from '@/hooks/useAccountGroup';
import { useCreateAccount } from '@/hooks/useAccount';
import { useCompany } from '@/contexts/CompanyContext';
import { ApiValidationError } from '@/lib/api/response';
import { toast } from 'sonner';
import type { AccountGroup } from '@/@types/account-group.types';

export const AccountCreatePage = () => {
  const router = useRouter();
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const basePath = router.query.slug ? `/dashboard/${router.query.slug}/master/account` : '/master-data/account';

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountGroupId: 0,
      code: '',
      name: '',
      type: 'debet',
      pos_code: '',
      description: '',
      category: undefined,
      isActive: true,
      is_lock: false,
    } satisfies Partial<AccountFormValues>,
  });

  // Group Account search and scroll pagination state
  const [groupSearch, setGroupSearch] = useState('');
  const [groupPage, setGroupPage] = useState(1);
  const [accumulatedGroups, setAccumulatedGroups] = useState<AccountGroup[]>([]);

  const { data: accountGroupsData, isLoading: isLoadingGroups, isFetching: isFetchingGroups } = useAccountGroups({
    page: groupPage,
    perPage: 20, // Load 20 groups per request
    search: groupSearch,
    company_id: companyId ?? undefined,
    enabled: !isLoadingCompany && !!companyId,
  });

  // Accumulate groups
  useEffect(() => {
    if (accountGroupsData?.data) {
      setAccumulatedGroups((prev) => {
        if (groupPage === 1) {
          return accountGroupsData.data;
        }
        const existingIds = new Set(prev.map((g) => g.id));
        const newItems = accountGroupsData.data.filter((g) => !existingIds.has(g.id));
        return [...prev, ...newItems];
      });
    }
  }, [accountGroupsData, groupPage]);

  const hasMoreGroups = accountGroupsData ? groupPage < accountGroupsData.meta.lastPage : false;

  const handleGroupSearch = (val: string) => {
    setGroupSearch(val);
    setGroupPage(1);
  };

  const handleLoadMoreGroups = () => {
    if (hasMoreGroups && !isLoadingGroups) {
      setGroupPage((prev) => prev + 1);
    }
  };

  const createMutation = useCreateAccount();

  const translateValidationMessage = (message: string, field: string): string => {
    const msg = message.toLowerCase();
    if (msg.includes('already been taken')) {
      if (field === 'code') return 'Kode akun sudah digunakan.';
      return 'Nilai ini sudah digunakan.';
    }
    if (msg.includes('required')) {
      if (field === 'code') return 'Kode akun wajib diisi.';
      if (field === 'name') return 'Nama akun wajib diisi.';
      if (field === 'account_group_id' || field === 'accountGroupId') return 'Grup akun wajib dipilih.';
      if (field === 'type') return 'Tipe akun wajib dipilih.';
      if (field === 'category') return 'Kategori laporan wajib dipilih.';
      return 'Kolom ini wajib diisi.';
    }
    if (msg.includes('invalid') || msg.includes('must be') || msg.includes('in:')) {
      if (field === 'type') return 'Tipe akun yang dipilih tidak valid (harus Debet atau Kredit).';
      if (field === 'category') return 'Kategori laporan yang dipilih tidak valid.';
      if (field === 'account_group_id' || field === 'accountGroupId') return 'Grup akun yang dipilih tidak valid.';
      return 'Nilai yang dimasukkan tidak valid.';
    }
    if (msg.includes('may not be greater than') || msg.includes('max')) {
      if (field === 'code') return 'Kode akun maksimal 50 karakter.';
      if (field === 'name') return 'Nama akun maksimal 255 karakter.';
      if (field === 'pos_code') return 'Kode pos maksimal 50 karakter.';
    }
    return message;
  };

  const mapValidationErrors = (error: ApiValidationError) => {
    Object.entries(error.fieldErrors).forEach(([field, messages]) => {
      const mappedField = field === 'account_group_id' ? 'accountGroupId' : field;
      const originalMessage = messages?.[0] || 'Validasi gagal';
      const translatedMessage = translateValidationMessage(originalMessage, field);
      form.setError(mappedField as keyof AccountFormValues, { message: translatedMessage });
    });
  };

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      await createMutation.mutateAsync({
        accountGroupId: values.accountGroupId,
        code: values.code,
        name: values.name,
        type: values.type,
        pos_code: values.pos_code ? values.pos_code.trim() : null,
        description: values.description ? values.description.trim() : null,
        category: values.category || null,
        // isActive: values.isActive,
      });
      toast.success('Akun berhasil dibuat');
      router.push(basePath);
    } catch (error) {
      console.error('[Create Account Error]:', error);
      if (error instanceof ApiValidationError) {
        mapValidationErrors(error);
        let mainMessage = error.message;
        if (mainMessage.toLowerCase().includes('validation') || mainMessage.toLowerCase().includes('given data was invalid')) {
          mainMessage = 'Gagal menyimpan data karena validasi tidak terpenuhi.';
        }
        toast.error(mainMessage);
        return;
      }
      toast.error('Gagal membuat akun');
    }
  };

  const accountGroups = accumulatedGroups;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Akun"
          subtitle="Buat akun baru dan hubungkan ke grup akun"
          breadcrumbs={[
            { label: 'Akun', onClick: () => router.push(basePath) },
            { label: 'Tambah Akun' }
          ]}
          onBack={() => router.push(basePath)}
        />

        <Card className="p-6">
          <AccountForm
            form={form}
            accountGroups={accountGroups}
            onSubmit={handleSubmit}
            onCancel={() => router.push(basePath)}
            isSubmitting={createMutation.isPending}
            submitLabel="Simpan"
            isLoadingGroups={isLoadingGroups || isFetchingGroups}
            onGroupSearchChange={handleGroupSearch}
            onLoadMoreGroups={handleLoadMoreGroups}
            hasMoreGroups={hasMoreGroups}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};
