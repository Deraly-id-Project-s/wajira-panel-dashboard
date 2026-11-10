import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/loading-state';
import GeneralJournalDetailView from '@/components/features/general-journal/GeneralJournalDetailView';

export default function GeneralJournalDetailPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const journalId = typeof rawId === 'string' ? Number(rawId) : undefined;

  if (!router.isReady) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat jurnal umum..." />
      </DashboardLayout>
    );
  }

  return <GeneralJournalDetailView journalId={journalId} />;
}
