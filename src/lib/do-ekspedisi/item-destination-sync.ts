import type {
  DoEkspedisiItemDestination,
  DoEkspedisiItemDestinationPayload,
} from '@/types/do-ekspedisi.types';
import {
  createDoEkspedisiItemDestination,
  deleteDoEkspedisiItemDestination,
  updateDoEkspedisiItemDestination,
} from '@/services/do-ekspedisi.service';

export interface DoEkspedisiDestinationDraft {
  id?: string;
  destination: string;
  driverNote: string;
  mapsUrl: string;
}

interface SyncDoEkspedisiItemDestinationsArgs {
  doExpeditionItemId: string | number;
  primaryDestinationId?: string;
  primaryDestination: Omit<DoEkspedisiDestinationDraft, 'id'>;
  additionalDestinations: DoEkspedisiDestinationDraft[];
  existingDestinations?: DoEkspedisiItemDestination[];
}

const toPayload = (
  doExpeditionItemId: string | number,
  orderNumber: number,
  draft: Omit<DoEkspedisiDestinationDraft, 'id'>,
): DoEkspedisiItemDestinationPayload => ({
  destination: draft.destination,
  driver_note: draft.driverNote,
  order_number: orderNumber,
  do_expedition_item_id: doExpeditionItemId,
  maps_url: draft.mapsUrl,
});

export async function syncDoEkspedisiItemDestinations({
  doExpeditionItemId,
  primaryDestinationId,
  primaryDestination,
  additionalDestinations,
  existingDestinations = [],
}: SyncDoEkspedisiItemDestinationsArgs) {
  const submitted = [
    { id: primaryDestinationId, ...primaryDestination },
    ...additionalDestinations,
  ];

  const keptIds = new Set<string>();

  await Promise.all(
    submitted.map(async (destination, index) => {
      const payload = toPayload(doExpeditionItemId, index + 1, destination);

      if (destination.id) {
        keptIds.add(destination.id);
        await updateDoEkspedisiItemDestination(destination.id, payload);
        return;
      }

      await createDoEkspedisiItemDestination(payload);
    }),
  );

  await Promise.all(
    existingDestinations
      .filter((destination) => !keptIds.has(String(destination.id)))
      .map((destination) => deleteDoEkspedisiItemDestination(destination.id)),
  );
}
