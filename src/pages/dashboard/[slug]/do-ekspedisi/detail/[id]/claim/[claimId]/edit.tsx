import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DOEkspedisiClaimForm, type DOEkspedisiClaimFormValues } from '@/components/features/do-ekspedisi/DOEkspedisiClaimForm';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import type { DoEkspedisiClaimDocumentation } from '@/@types/do-ekspedisi.types';
import {
  useCreateExpeditionClaimDocumentation,
  useDoDetailResourceMutation,
  useDoEkspedisiDetail,
  useExpeditionClaimDetail,
  useUpdateExpeditionClaim,
} from '@/hooks/useDoEkspedisi';

export default function EditDOEkspedisiClaimPage() {
  const router = useRouter();
  const { slug, id, claimId } = router.query;
  const expeditionId = id ? String(id) : null;
  const currentClaimId = claimId ? String(claimId) : null;

  const detailQuery = useDoEkspedisiDetail(expeditionId);
  const claimQuery = useExpeditionClaimDetail(currentClaimId);
  const updateClaimMutation = useUpdateExpeditionClaim(expeditionId ?? '');
  const createDocumentationMutation = useCreateExpeditionClaimDocumentation(expeditionId ?? '');
  const documentationMutations = useDoDetailResourceMutation('documentation', expeditionId ?? '');

  const fallbackClaim = React.useMemo(
    () => detailQuery.data?.expeditionClaims?.find((claim) => String(claim.id) === currentClaimId) ?? null,
    [currentClaimId, detailQuery.data?.expeditionClaims],
  );
  const claimData = claimQuery.data?.id ? claimQuery.data : fallbackClaim;
  const isSubmitting = updateClaimMutation.isPending || createDocumentationMutation.isPending;

  const backToDetail = React.useCallback(() => {
    if (slug && expeditionId) void router.push(`/dashboard/${slug}/do-ekspedisi/detail/${expeditionId}`);
  }, [expeditionId, router, slug]);

  const backToList = React.useCallback(() => {
    if (slug) void router.push(`/dashboard/${slug}/do-ekspedisi`);
  }, [router, slug]);

  const handleSave = async (values: DOEkspedisiClaimFormValues) => {
    if (!detailQuery.data || !currentClaimId || !expeditionId) return;

    try {
      const savedClaim = await updateClaimMutation.mutateAsync({
        id: currentClaimId,
        payload: {
          do_expeditions_id: expeditionId,
          driver_id: detailQuery.data.driverId ?? '',
          subject: values.subject,
          description: values.description,
          claim_nominal: values.claimNominal,
        },
      });

      await Promise.all(values.documentations.map((documentation) => createDocumentationMutation.mutateAsync({
        do_expedition_claim_id: savedClaim.id || currentClaimId,
        caption: documentation.caption || null,
        image: documentation.image,
      })));

      toast.success('Claim berhasil diperbarui');
      backToDetail();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui claim');
    }
  };

  const handleDeleteDocumentation = async (documentation: DoEkspedisiClaimDocumentation) => {
    if (!window.confirm('Hapus dokumentasi ini?')) return;

    try {
      await documentationMutations.remove.mutateAsync(documentation.id);
      toast.success('Dokumentasi berhasil dihapus');
      await Promise.all([detailQuery.refetch(), claimQuery.refetch()]);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus dokumentasi');
    }
  };

  if (detailQuery.isLoading || claimQuery.isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  if (!detailQuery.data || !claimData) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-red-500">Gagal memuat data claim</div>
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
            { label: 'Edit Driver Claim' },
          ]}
          title="Edit Driver Claim"
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
          initialData={claimData}
          onSubmit={handleSave}
          onDeleteDocumentation={handleDeleteDocumentation}
          isSubmitting={isSubmitting}
          isDeletingDocumentation={documentationMutations.remove.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
