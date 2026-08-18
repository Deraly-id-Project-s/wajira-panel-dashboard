import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PurchaseForm from '@/components/features/purchase/PurchaseForm';
import { usePurchaseById, useUpdatePurchase } from '@/hooks/usePurchase';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditPurchasePage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { slug, itemId } = router.query; // Changed from id to itemId to match folder structure

  // Note: usePurchaseById usually expects 'id'. We need to ensure logic handles 'itemId'
  const { data: purchase, isLoading } = usePurchaseById(itemId as string);
  const updateMutation = useUpdatePurchase();

  const defaultValues = useMemo(() => {
    if (!purchase) return undefined;
    return {
      supplierName: purchase.supplierName,
      date: purchase.date ? purchase.date.slice(0, 10) : '',
      code: purchase.code,
      supplierAddress: purchase.supplierAddress,
      supplierNpwp: purchase.supplierNpwp,
    };
  }, [purchase]);

  const handleSubmit = async (data: any) => {
    try {
      await updateMutation.mutateAsync({
        id: itemId as string,
        payload: data,
      });
      toast.success('Pembelian berhasil diperbarui');
      router.push(`/dashboard/${slug}/transaksi/pembelian-unit`);
    } catch {
      toast.error('Gagal memperbarui pembelian');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!purchase) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Data tidak ditemukan</p>
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            Kembali
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
            { label: 'Edit Pembelian' }
          ]}
          title="Edit Pembelian"
          subtitle={
            <>
              <span>Kode Beli:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase.code}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`)}
        />

        <Card className="rounded-md border border-gray-200 shadow-none">
          <CardContent className="p-6">
            <PurchaseForm defaultValues={defaultValues} onSubmit={handleSubmit} onCancel={() => router.back()} loading={updateMutation.isPending} companyId={companyId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
