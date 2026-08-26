import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AccountForm } from './AccountForm';
import { accountSchema, type AccountFormValues } from '@/schemas/account-master.schema';
import { useAccount } from '@/hooks/useAccount';
import { useAccountGroups } from '@/hooks/useAccountGroup';
import { useUpdateAccount } from '@/hooks/useAccount';
import { useCompany } from '@/contexts/CompanyContext';
import { ApiValidationError } from '@/lib/api/response';
import { toast } from 'sonner';
import { getAccountTypeFromCategory } from '@/lib/account';
import type { AccountGroup } from '@/types/account-group.types';

export const AccountEditPage = () => {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const { companyId, isLoading: isLoadingCompany } = useCompany();
  const basePath = router.query.slug ? `/dashboard/${router.query.slug}/master/account` : '/master-data/account';

  const { data, isLoading, isError } = useAccount(id);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      accountGroupId: 0,
      code: '',
      name: '',
      description: '',
      category: undefined,
      isActive: true,
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

  const updateMutation = useUpdateAccount();

  useEffect(() => {
    if (data) {
      form.reset({
        accountGroupId: Number(data.accountGroupId),
        code: data.code,
        name: data.name,
        description: data.description ?? '',
        category: (data.category as AccountFormValues['category']) ?? undefined,
        isActive: data.isActive,
      });
    }
  }, [data, form]);

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
      if (field === 'category') return 'Kategori laporan wajib dipilih.';
      return 'Kolom ini wajib diisi.';
    }
    if (msg.includes('invalid') || msg.includes('must be')) {
      if (field === 'category') return 'Kategori laporan yang dipilih tidak valid.';
      if (field === 'account_group_id' || field === 'accountGroupId') return 'Grup akun yang dipilih tidak valid.';
      return 'Nilai yang dimasukkan tidak valid.';
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
    if (!id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        payload: {
          accountGroupId: values.accountGroupId,
          code: values.code,
          name: values.name,
          description: values.description,
          category: values.category,
          type: getAccountTypeFromCategory(values.category),
          // isActive: values.isActive,
        },
      });
      toast.success('Akun berhasil diperbarui');
      router.push(basePath);
    } catch (error) {
      console.error('[Update Account Error]:', error);
      if (error instanceof ApiValidationError) {
        mapValidationErrors(error);
        let mainMessage = error.message;
        if (mainMessage.toLowerCase().includes('validation') || mainMessage.toLowerCase().includes('given data was invalid')) {
          mainMessage = 'Gagal menyimpan data karena validasi tidak terpenuhi.';
        }
        toast.error(mainMessage);
        return;
      }
      toast.error('Gagal memperbarui akun');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Card className="p-6">Memuat data...</Card>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout>
        <Card className="p-6 text-red-600">Gagal memuat detail akun</Card>
      </DashboardLayout>
    );
  }

  const accountGroups = accumulatedGroups;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Edit Akun"
          subtitle="Perbarui informasi akun"
          breadcrumbs={[
            { label: 'Akun', onClick: () => router.push(basePath) },
            { label: 'Edit Akun' }
          ]}
          onBack={() => router.push(basePath)}
        />

        <Card className="p-6">
          <AccountForm
            form={form}
            accountGroups={accountGroups}
            onSubmit={handleSubmit}
            onCancel={() => router.push(basePath)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Perbarui"
            isLoadingGroups={isLoadingGroups || isFetchingGroups}
            onGroupSearchChange={handleGroupSearch}
            onLoadMoreGroups={handleLoadMoreGroups}
            hasMoreGroups={hasMoreGroups}
            isLock={data?.is_lock}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};
