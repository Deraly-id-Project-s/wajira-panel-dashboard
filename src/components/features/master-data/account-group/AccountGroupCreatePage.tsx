import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AccountGroupForm } from './AccountGroupForm';
import { accountGroupSchema, type AccountGroupFormValues } from '@/scheme/account-group.schema';
import { useCreateAccountGroup } from '@/hooks/useAccountGroup';
import { ApiValidationError } from '@/lib/api/response';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export const AccountGroupCreatePage = () => {
  const router = useRouter();
  const form = useForm<AccountGroupFormValues>({
    resolver: zodResolver(accountGroupSchema),
    defaultValues: {
      group_code: '',
      description: '',
    } satisfies Partial<AccountGroupFormValues>,
  });

  const { companyId } = useCompany();

  const createMutation = useCreateAccountGroup();

  const handleSubmit = async (values: AccountGroupFormValues) => {
    const slug = router.query.slug as string;
    const backPath = slug ? `/dashboard/${slug}/master/account-group` : '/master-data/account-group';

    try {
      await createMutation.mutateAsync({
        ...values,
        company_id: Number(companyId) || 0,
      });
      toast.success('Grup akun berhasil dibuat');
      router.push(backPath);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof AccountGroupFormValues, { message: messages?.[0] || 'Validasi gagal' });
        });
        toast.error(error.message || 'Validasi gagal');
        return;
      }
      toast.error('Gagal membuat grup akun');
    }
  };

  const onCancel = () => {
    const slug = router.query.slug as string;
    const backPath = slug ? `/dashboard/${slug}/master/account-group` : '/master-data/account-group';
    router.push(backPath);
  };

  return (
    <DashboardLayout>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Tambah Grup Akun</h1>
            <p className="text-sm text-muted-foreground">Buat grup akun baru untuk mengelompokkan akun</p>
          </div>
        </div>

        <Card>
          <AccountGroupForm form={form} onSubmit={handleSubmit} onCancel={onCancel} isSubmitting={createMutation.isPending} />
        </Card>
      </div>
    </DashboardLayout>
  );
};
