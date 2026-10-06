import { useState } from 'react';
import { ArrowRightLeft, Building2, Package, Search, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useAssignFewerStockItems, useFewerStockItems } from '@/hooks/useUnitTransaction';
import { showError, showSuccess } from '@/lib/toast';

interface MoveUnitStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTransactionId: string | number;
  sourceTransactionCode?: string;
  transactionType: 'purchase' | 'sales';
  unitTypeId: string | number;
  unitTypeName?: string;
  selectedDetailIds: Array<string | number>;
  onSuccess?: () => void;
}

const parseApiError = (err: any): string => {
  const message = err?.response?.data?.message || err?.message || '';
  const details = err?.details ?? err?.response?.data?.errors;
  if (typeof details === 'string') return details;
  if (details && typeof details === 'object') {
    return Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ');
  }
  return message || 'Terjadi kesalahan saat memindahkan unit';
};

export function MoveUnitStockModal({
  open,
  onOpenChange,
  sourceTransactionId,
  sourceTransactionCode,
  transactionType,
  unitTypeId,
  unitTypeName,
  selectedDetailIds,
  onSuccess,
}: MoveUnitStockModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<number | string | null>(null);

  const { data: fewerStockData, isLoading, isError, error } = useFewerStockItems(
    {
      type: transactionType,
      unit_type_id: unitTypeId,
      search: search || undefined,
    },
    open && Boolean(unitTypeId),
  );

  const assignMutation = useAssignFewerStockItems();

  const rawItems = Array.isArray(fewerStockData?.data?.data)
    ? fewerStockData.data.data
    : Array.isArray(fewerStockData?.data)
    ? fewerStockData.data
    : Array.isArray(fewerStockData)
    ? fewerStockData
    : [];

  const candidates = rawItems.filter(
    (item: any) => String(item?.id ?? '') !== String(sourceTransactionId ?? ''),
  );

  const handleTransfer = async () => {
    if (!selectedTargetId) {
      showError('Pilih transaksi tujuan terlebih dahulu');
      return;
    }

    if (!selectedDetailIds || selectedDetailIds.length === 0) {
      showError('Pilih minimal satu detail unit yang akan dipindahkan');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        sourceTransactionId,
        payload: {
          unit_transaction_id: selectedTargetId,
          unit_transaction_item_details_id: selectedDetailIds,
        },
      });

      showSuccess('Unit telah dipindahkan ke tujuan');
      setSelectedTargetId(null);
      setSearch('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      showError(parseApiError(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Pindahkan Unit Stok
          </DialogTitle>
          <DialogDescription>
            Pindahkan unit tipe stok yang dipilih ke transaksi tujuan yang kekurangan stok.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 overflow-y-auto">
          {/* Summary Box */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <Package className="h-4 w-4 text-blue-600" />
                <span>Tipe Unit: <strong className="text-slate-900">{unitTypeName || `-`}</strong></span>
              </div>
              <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-semibold">
                {selectedDetailIds.length} Unit Dipilih
              </Badge>
            </div>
            {sourceTransactionCode && (
              <p className="text-slate-600">
                Transaksi Asal: <span className="font-semibold text-slate-900">{sourceTransactionCode}</span>
              </p>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode transaksi, supplier/customer, atau gudang tujuan..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Candidate List */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-8">
                <LoadingState variant="inline" text="Memuat transaksi tujuan..." iconClassName="h-4 w-4 text-muted-foreground" />
              </div>
            ) : isError ? (
              <div className="py-8 text-center text-sm text-red-500">
                Gagal memuat transaksi tujuan: {parseApiError(error)}
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Tidak ada transaksi {transactionType === 'purchase' ? 'pembelian' : 'penjualan'} lain dengan kekurangan stok untuk unit tipe ini.
              </div>
            ) : (
              candidates.map((item: any) => {
                const targetId = item.id;
                const isSelected = String(selectedTargetId) === String(targetId);
                const shortage = item.total_kurang ?? item.total_shortage ?? 0;
                const partyName = item.person?.name ?? '-';
                const warehouseName = item.warehouse?.name ?? '-';

                return (
                  <div
                    key={targetId}
                    onClick={() => setSelectedTargetId(targetId)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="target_transaction"
                          checked={isSelected}
                          onChange={() => setSelectedTargetId(targetId)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-slate-900 text-sm">{item.code || `ID: ${targetId}`}</span>
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">
                          {item.type || transactionType}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pl-6">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {partyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {warehouseName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Kekurangan Stok</p>
                      <span className="inline-block mt-0.5 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {shortage} Unit
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleTransfer}
            disabled={!selectedTargetId || assignMutation.isPending || selectedDetailIds.length === 0}
          >
            {assignMutation.isPending ? (
              <LoadingState variant="inline" text="Memindahkan..." iconClassName="text-white" />
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Pindahkan Unit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
