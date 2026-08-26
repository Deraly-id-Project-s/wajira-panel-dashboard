import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { AccountGroupForm } from './AccountGroupForm';
import { accountGroupSchema, type AccountGroupFormValues } from '@/schemas/account-group.schema';
import { useCreateAccountGroup } from '@/hooks/useAccountGroup';
import { ApiValidationError } from '@/lib/api/response';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export const AccountGroupCreatePage = () => {
  const router = useRouter();
  const slug = router.query.slug as string;
  const backPath = slug ? `/dashboard/${slug}/master/account-group` : '/master-data/account-group';
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
    router.push(backPath);
  };

  return (
    <DashboardLayout>
      <div className="space-y-2">
        <PageHeader
          title="Tambah Grup Akun"
          subtitle="Buat grup akun baru untuk mengelompokkan akun"
          breadcrumbs={[
            { label: 'Grup Akun', onClick: onCancel },
            { label: 'Tambah Grup Akun' }
          ]}
          onBack={onCancel}
        />

        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6">
                <AccountGroupForm form={form} />
              </div>
              <div className="shrink-0 flex gap-3 px-6 py-4 border-t bg-gray-50">
                <Button type="button" variant="outline" className="flex-1 rounded-md border-[#D4D4D8] text-[15px] text-[#171717]" onClick={onCancel} disabled={createMutation.isPending}>
                  Batal
                </Button>
                <Button type="submit" className="flex-1 rounded-md bg-[#1F3B5B] text-[15px] font-medium text-white hover:bg-[#19314b]" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </DashboardLayout>
  );
};
