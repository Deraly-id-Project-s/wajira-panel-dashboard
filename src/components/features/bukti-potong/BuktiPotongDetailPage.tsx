'use client';

import Head from 'next/head';
import { useRouter } from 'next/router';
import { Edit, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { formatDate } from '@/lib/utils/format';
import { BuktiPotongDetailCards } from './BuktiPotongDetailCards';

const formatSource = (source: string) => {
  if (source === 'external') return 'Client / Supplier';
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : '-';
};

export default function BuktiPotongDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const itemId = typeof rawId === 'string' ? rawId : undefined;
  const basePath =
    typeof slug === 'string'
      ? `/dashboard/${slug}/administrasi/bukti-potong`
      : '/administrasi/bukti-potong';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');

  const { data, isLoading, error } = useWithholdingTaxDetail(itemId || null);
  const errorMessage = error instanceof Error ? error.message : null;

  const handleBack = () => {
    void router.push(basePath);
  };

  const handleEdit = () => {
    if (!itemId) return;
    void router.push(
      typeof slug === 'string'
        ? `/dashboard/${slug}/administrasi/bukti-potong/${itemId}/edit`
        : `/administrasi/bukti-potong/${itemId}/edit`
    );
  };

  if (!router.isReady || isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat detail bukti potong..." />
      </DashboardLayout>
    );
  }

  if (errorMessage || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Bukti Potong', onClick: handleBack },
              { label: 'Detail Bukti Potong' },
            ]}
            title="Data Bukti Potong"
            subtitle="Data bukti potong tidak dapat ditemukan"
            onBack={handleBack}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              {errorMessage ??
                'Data bukti potong tidak ditemukan. Periksa kembali ID bukti potong pada URL.'}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Bukti Potong - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Bukti Potong', onClick: handleBack },
            { label: 'Detail Bukti Potong' },
          ]}
          title="Data Bukti Potong"
          onBack={handleBack}
          subtitle={
            <>
              <span>No Bukti Potong:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
                {data.withholding_number || '-'}
              </span>
              <Badge variant="outline">{formatSource(data.source)}</Badge>
            </>
          }
          actions={
            canEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Data
              </Button>
            )
          }
        />

        {/* Reusable Detail Cards Section */}
        <BuktiPotongDetailCards data={data} />

        {/* Collapsible Box for System Metadata and Notes */}
        <div className="space-y-3">
          <CollapsibleBox
            title="Informasi Tambahan & Riwayat Sistem"
            description="Informasi metadata pencatatan dan keterangan tambahan"
            icon={Info}
            defaultExpanded
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Dibuat Pada
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(data.created_at)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Terakhir Diubah
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatDate(data.updated_at)}
                  </p>
                </div>
                {data.company?.name && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Entitas Perusahaan
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {data.company.name}
                    </p>
                  </div>
                )}
              </div>

              {data.do_invoice?.description && (
                <div className="rounded-md border border-slate-200/80 bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Keterangan Invoice Terkait
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                    {data.do_invoice.description}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleBox>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="h-10 px-8"
          >
            Kembali ke Daftar Bukti Potong
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
