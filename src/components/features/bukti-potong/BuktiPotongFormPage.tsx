import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCompany } from '@/contexts/CompanyContext';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import BuktiPotongForm from './BuktiPotongForm';

interface Props {
  mode: 'create' | 'edit';
}

export default function BuktiPotongFormPage({ mode }: Props) {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '4';
  const basePath = typeof slug === 'string' ? `/dashboard/${slug}/administrasi/bukti-potong` : '/administrasi/bukti-potong';
  const itemId = mode === 'edit' && typeof rawId === 'string' ? rawId : undefined;
  const isEdit = mode === 'edit';

  const { data: itemData, isLoading: isFetching } = useWithholdingTaxDetail(itemId || null);

  const handleBack = () => {
    void router.push(basePath);
  };

  if (isEdit && (!router.isReady || isFetching)) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat data bukti potong..." />
      </DashboardLayout>
    );
  }

  if (isEdit && !itemData && !isFetching) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Edit Bukti Potong"
            subtitle="Data bukti potong tidak dapat ditemukan"
            onBack={handleBack}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              Data bukti potong tidak ditemukan. Periksa kembali ID bukti potong pada URL.
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>{isEdit ? 'Edit' : 'Tambah'} Bukti Potong - Wajira Dashboard</title>
      </Head>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Bukti Potong', onClick: handleBack },
            { label: isEdit ? 'Edit Bukti Potong' : 'Tambah Bukti Potong' },
          ]}
          title={isEdit ? 'Edit Bukti Potong' : 'Tambah Bukti Potong'}
          subtitle={
            isEdit
              ? itemData?.withholding_number
                ? `Perbarui rincian bukti potong (${itemData.withholding_number})`
                : 'Perbarui rincian bukti potong yang sudah ada'
              : 'Masukkan detail dan rincian data bukti potong baru'
          }
          onBack={handleBack}
        />

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <BuktiPotongForm
              item={isEdit ? itemData || null : null}
              companyId={safeCompanyId}
              onSuccess={handleBack}
              onCancel={handleBack}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
