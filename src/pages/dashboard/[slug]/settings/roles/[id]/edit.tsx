import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleForm } from '@/components/features/roles/RoleForm';

export default function EditRolePage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <DashboardLayout>
      {id && <RoleForm id={id as string} />}
    </DashboardLayout>
  );
}
