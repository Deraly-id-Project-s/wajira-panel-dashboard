import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiClaimForm, type DOEkspedisiClaimFormValues } from '@/components/features/do-ekspedisi/DOEkspedisiClaimForm';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { useCreateExpeditionClaim, useCreateExpeditionClaimDocumentation, useDoEkspedisiDetail } from '@/hooks/useDoEkspedisi';

export default function CreateDOEkspedisiClaimPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const expeditionId = id ? String(id) : null;

  const detailQuery = useDoEkspedisiDetail(expeditionId);
  const createClaimMutation = useCreateExpeditionClaim(expeditionId ?? '');
  const createDocumentationMutation = useCreateExpeditionClaimDocumentation(expeditionId ?? '');
  const isSubmitting = createClaimMutation.isPending || createDocumentationMutation.isPending;

  const backToDetail = React.useCallback(() => {
    if (slug && expeditionId) void router.push(`/dashboard/${slug}/do-ekspedisi/detail/${expeditionId}`);
  }, [expeditionId, router, slug]);

  const backToList = React.useCallback(() => {
    if (slug) void router.push(`/dashboard/${slug}/do-ekspedisi`);
  }, [router, slug]);

  const handleSave = async (values: DOEkspedisiClaimFormValues) => {
    if (!detailQuery.data || !expeditionId) return;

    try {
      const savedClaim = await createClaimMutation.mutateAsync({
        do_expeditions_id: expeditionId,
        driver_id: detailQuery.data.driverId ?? '',
        subject: values.subject,
        description: values.description,
        claim_nominal: values.claimNominal,
      });

      await Promise.all(values.documentations.map((documentation) => createDocumentationMutation.mutateAsync({
        do_expedition_claim_id: savedClaim.id,
        caption: documentation.caption || null,
        image: documentation.image,
      })));

      toast.success('Claim berhasil ditambahkan');
      backToDetail();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan claim');
    }
  };

  if (detailQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!detailQuery.data) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-red-500">Gagal memuat detail DO Ekspedisi</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'DO Ekspedisi', onClick: backToList },
            { label: 'Detail DO', onClick: backToDetail },
            { label: 'Tambah Klaim Ekspedisi' },
          ]}
          title="Tambah Klaim Ekspedisi"
          subtitle={(
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode DO:</span>
              <span className="font-semibold text-orange-600">{detailQuery.data.doCode || '-'}</span>
            </div>
          )}
          onBack={backToDetail}
        />

        <DOEkspedisiClaimForm
          expedition={detailQuery.data}
          onSubmit={handleSave}
          isSubmitting={isSubmitting}
        />
      </div>
    </DashboardLayout>
  );
}
