import { useQuery } from '@tanstack/react-query';
import { getVehicleEquipmentAssignmentReport } from '@/services/vehicle-equipment-assignment-report.service';
import type { VehicleEquipmentAssignmentReportParams } from '@/types/vehicle-equipment-assignment-report.types';

export const useVehicleEquipmentAssignmentReport = (
  params?: VehicleEquipmentAssignmentReportParams,
) =>
  useQuery({
    queryKey: ['vehicle-equipment-assignment-report', params],
    queryFn: () => getVehicleEquipmentAssignmentReport(params),
    staleTime: 30 * 1000,
  });
