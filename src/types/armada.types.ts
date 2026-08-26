import type { PaginatedResult } from './pagination.types';

export const ARMADA_EQUIPMENT_FIELDS = [
  'radio_tape',
  'jack',
  'spare_tire',
  'toolkit',
  'jack_handle',
  'pressure_pipe_1',
  'first_aid_kit',
  'cigarette_lighter',
  'pressure_pipe_2',
  'seat_saddle',
  'handlebar_hose',
  'fire_extinguisher',
  'large_tie_down_strap',
  'rearview_mirror',
  'ati_foam',
  'small_tie_down_strap',
  'toolbox_lock',
  'service_book',
] as const;

export type ArmadaEquipmentField = (typeof ARMADA_EQUIPMENT_FIELDS)[number];

export type ArmadaEquipment = Partial<Record<ArmadaEquipmentField, number | null>>;

export interface Armada {
  id: number | string;
  uuid?: string;
  registrationNumber: string;
  type: string;
  machineNumber: string;
  chassisNumber: string;
  stnkAge?: string | null;
  kirAge?: string | null;
  stnkNumber?: string | null;
  kirBook?: string | null;
  equipment: ArmadaEquipment;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArmadaPayload extends ArmadaEquipment {
  registration_number: string;
  type: string;
  machine_number: string;
  chassis_number: string;
  stnk_age?: string | null;
  kir_age?: string | null;
  stnk_number?: string | null;
  kir_book?: string | null;
  vehicle_fleet_id?: string | number;
}

export interface ArmadaListParams {
  search?: string;
  registration_number?: string;
}

export type ArmadaListResponse = PaginatedResult<Armada>;
