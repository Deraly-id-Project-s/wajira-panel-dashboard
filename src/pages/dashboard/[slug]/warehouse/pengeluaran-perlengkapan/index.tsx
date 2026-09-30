import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/loading-state';

export default function LegacyVehicleEquipmentIssueListRedirect() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  useEffect(() => {
    if (slug) {
      router.replace(`/dashboard/${slug}/warehouse/perlengkapan-keluar`);
    }
  }, [router, slug]);

  return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
}
