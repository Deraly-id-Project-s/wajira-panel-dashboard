import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { DocumentTemplateEditor } from '@/components/features/document-template/DocumentTemplateEditor';
import { useDocumentTemplate, useUpdateDocumentTemplate } from '@/hooks/useDocumentTemplate';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { DocumentTemplateFormValues } from '@/scheme/document-template.schema';

export default function EditDocumentTemplatePage() {
  const router = useRouter();
  const slug = String(router.query.slug ?? '');
  const id = router.query.id ? String(router.query.id) : null;
  const { hasPermission } = usePermissionGuard();
  const { data, isLoading, isError } = useDocumentTemplate(id);
  const mutation = useUpdateDocumentTemplate();
  const submit = async (values: DocumentTemplateFormValues) => {
    if (!id || !hasPermission('master-data:edit')) return;
    try {
      await mutation.mutateAsync({ id, payload: values });
      toast.success('Dokumen template berhasil diubah');
      await router.push(`/dashboard/${slug}/master/document-template`);
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal mengubah dokumen template');
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Dokumen Template', onClick: () => router.push(`/dashboard/${slug}/master/document-template`) },
            { label: 'Edit Dokumen Template' }
          ]}
          title="Edit Dokumen Template"
          subtitle="Perbarui isi dan tampilan template dokumen"
          onBack={() => router.push(`/dashboard/${slug}/master/document-template`)}
        />
        {isLoading ? (
          <LoadingState variant="section" text="Memuat dokumen template..." />
        ) : isError || !data ? (
          <p className="rounded-md border bg-white p-6 text-sm text-red-600">Dokumen template tidak dapat dimuat.</p>
        ) : (
          <DocumentTemplateEditor
            initialData={data}
            isSubmitting={mutation.isPending}
            onSubmit={submit}
            onCancel={() => void router.push(`/dashboard/${slug}/master/document-template`)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
