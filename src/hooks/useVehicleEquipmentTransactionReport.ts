import { useQuery } from '@tanstack/react-query';
import { getVehicleEquipmentTransactionReport } from '@/services/vehicle-equipment-transaction-report.service';
import type { VehicleEquipmentTransactionReportParams } from '@/types/vehicle-equipment-transaction-report.types';

export const useVehicleEquipmentTransactionReport = (
  params?: VehicleEquipmentTransactionReportParams,
) =>
  useQuery({
    queryKey: ['vehicle-equipment-transaction-report', params],
    queryFn: () => getVehicleEquipmentTransactionReport(params),
    staleTime: 30 * 1000,
  });
