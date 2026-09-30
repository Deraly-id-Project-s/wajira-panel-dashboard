import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoadingState } from '@/components/ui/loading-state';

export default function VehicleEquipmentReceiptEditRedirect() {
  const router = useRouter();
  const { slug, id } = router.query;

  useEffect(() => {
    if (slug && id) {
      router.replace(`/dashboard/${slug}/warehouse/perlengkapan-masuk/${id}`);
    }
  }, [id, router, slug]);

  return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
}
