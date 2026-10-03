export interface VehicleEquipmentAssignmentItem {
  id: number;
  uuid: string;
  activity_number: string;
  activity_type: 'assign' | 'dispatch' | string;
  activity_date: string;
  state: 'draft' | 'process' | 'done' | string;
  description: string | null;
  warehouse: {
    id: number;
    name: string;
  } | null;
  assignment: {
    id: number;
    qty: number;
    vehicle_fleet: {
      id: number;
      registration_number: string;
      type: string;
    } | null;
    vehicle_equipment: {
      id: number;
      code: string;
      name: string;
    } | null;
  } | null;
}

export interface VehicleEquipmentAssignmentReportParams {
  page?: number;
  perPage?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  activity_type?: 'assign' | 'dispatch';
  state?: 'draft' | 'process' | 'done' | string;
  warehouse_id?: number;
  code?: string;
  vehicle_equipment_id?: number;
}
