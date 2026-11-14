"use client";

import OutstandingTable from './OutstandingTable';

type PurchaseOrderTabProps = {
  perPage: number;
  dateRange?: { from?: Date; to?: Date };
  onActionsChange?: (actions: { print: () => void; download: () => void; archiveData?: object[] }) => void;
};

export default function PurchaseOrderTab(props: PurchaseOrderTabProps) {
  return <OutstandingTable type="purchase" {...props} />;
}
