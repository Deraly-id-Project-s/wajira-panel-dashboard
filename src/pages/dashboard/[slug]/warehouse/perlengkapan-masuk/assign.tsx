import { useRouter } from 'next/router';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import AssignDispatchActivityForm from '@/components/features/vehicle-equipment-warehouse/AssignDispatchActivityForm';
import { useCreateAssignDispatchActivity } from '@/hooks/useWarehouseActivity';
import type { AssignDispatchFormData } from '@/components/features/vehicle-equipment-warehouse/AssignDispatchActivityForm';
import type { CreateAssignDispatchPayload } from '@/@types/warehouse.types';

export default function AssignPerlengkapanPage() {
  const router = useRouter();
  const { slug } = router.query;
  const backPath = `/dashboard/${slug}/warehouse/perlengkapan-masuk`;

  const createMutation = useCreateAssignDispatchActivity();

  const handleSubmit = async (data: AssignDispatchFormData) => {
    const payload: CreateAssignDispatchPayload = {
      warehouse_id: data.warehouse_id,
      type: 'vehicle-equipment',
      activity_type: 'assign',
      activity_date: data.activity_date,
      vehicle_equipment_id: data.vehicle_equipment_id,
      vehicle_fleet_id: data.vehicle_fleet_id,
      qty: data.qty,
      description: data.description || undefined,
      state_note: data.state_note || undefined,
    };

    await createMutation.mutateAsync(payload, {
      onSuccess: () => {
        toast.success('Berhasil menambahkan aktivitas assign perlengkapan');
        router.push(backPath);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || error?.message || 'Gagal menyimpan aktivitas assign');
      },
    });
  };

  const handleCancel = () => router.push(backPath);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="cursor-pointer hover:text-slate-800" onClick={handleCancel}>
            Penerimaan Perlengkapan
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="font-medium text-slate-800">Assign Perlengkapan</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assign Perlengkapan ke Armada</h1>
            <p className="text-sm text-slate-500">Assign perlengkapan kendaraan ke armada yang ditentukan</p>
          </div>
        </div>

        <AssignDispatchActivityForm
          activityType="assign"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
