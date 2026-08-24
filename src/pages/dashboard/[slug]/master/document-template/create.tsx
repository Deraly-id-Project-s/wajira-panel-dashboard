import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DocumentTemplateEditor } from '@/components/features/document-template/DocumentTemplateEditor';
import { useCreateDocumentTemplate } from '@/hooks/useDocumentTemplate';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type { DocumentTemplateFormValues } from '@/scheme/document-template.schema';

export default function CreateDocumentTemplatePage() {
  const router = useRouter();
  const slug = String(router.query.slug ?? '');
  const { hasPermission } = usePermissionGuard();
  const mutation = useCreateDocumentTemplate();
  const submit = async (values: DocumentTemplateFormValues) => {
    if (!hasPermission('master-data:create')) return;
    try {
      await mutation.mutateAsync(values);
      toast.success('Dokumen template berhasil ditambahkan');
      await router.push(`/dashboard/${slug}/master/document-template`);
    } catch (error: any) {
      toast.error(error?.message ?? 'Gagal menambahkan dokumen template');
    }
  };
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Dokumen Template', onClick: () => router.push(`/dashboard/${slug}/master/document-template`) },
            { label: 'Tambah Dokumen Template' }
          ]}
          title="Tambah Dokumen Template"
          subtitle="Buat template dokumen baru"
          onBack={() => router.push(`/dashboard/${slug}/master/document-template`)}
        />
        <DocumentTemplateEditor
          isSubmitting={mutation.isPending}
          onSubmit={submit}
          onCancel={() => void router.push(`/dashboard/${slug}/master/document-template`)}
        />
      </div>
    </DashboardLayout>
  );
}
