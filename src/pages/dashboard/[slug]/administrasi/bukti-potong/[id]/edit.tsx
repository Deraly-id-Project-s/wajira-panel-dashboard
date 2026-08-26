import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import BuktiPotongForm from '@/components/features/bukti-potong/BuktiPotongForm';
import { useCompany } from '@/contexts/CompanyContext';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditBuktiPotongPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const companyNumber = Number(companyId || 4);
  const slug = router.query.slug as string;
  const { id } = router.query;

  const { data, isLoading } = useWithholdingTaxDetail(id as string);

  const handleBack = () => {
    router.push(slug ? `/dashboard/${slug}/administrasi/bukti-potong` : '/administrasi/bukti-potong');
  };

  if (!id) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* BREADCRUMB HEADER */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={() => router.push(`/dashboard/${slug}/administrasi/bukti-potong`)}>
            Bukti Potong
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Edit Bukti Potong</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900">Form Edit Bukti Potong</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>No Bukti Potong:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{data?.no_invoice}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {isLoading ? (
            <LoadingState variant="page" />
          ) : (
            <BuktiPotongForm
              item={data || null}
              companyId={companyNumber}
              onSuccess={handleBack}
              onCancel={handleBack}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
