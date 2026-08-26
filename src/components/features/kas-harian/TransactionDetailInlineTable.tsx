import { useMemo, useState } from 'react';
import { MoreVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FinanceBillingItem } from '@/types/finance-billing.types';
import { useCreateFinanceBillingItem, useDeleteFinanceBillingItem, useUpdateFinanceBillingItem } from '@/hooks/useFinanceBilling';
import { formatCurrency } from '@/lib/utils/currency';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';

type EditableRowId = number | 'new';

interface DraftRow {
  note: string;
  amount: number;
}

interface Props {
  items: FinanceBillingItem[];
  financeBillingId?: number;
  paymentAt?: string;
  disabled?: boolean;
}

const defaultDraft: DraftRow = {
  note: '',
  amount: 0,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  void fallback;
  return getApiErrorMessage(error);
};

export default function TransactionDetailInlineTable({ items, financeBillingId, paymentAt, disabled }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<EditableRowId | null>(null);
  const [draft, setDraft] = useState<DraftRow>(defaultDraft);

  const createMutation = useCreateFinanceBillingItem();
  const updateMutation = useUpdateFinanceBillingItem();
  const deleteMutation = useDeleteFinanceBillingItem();

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const hasRows = items.length > 0;
  const allSelected = hasRows && selectedIds.length === items.length;

  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        totalAmount: Number(item.cash_payment_amount || 0) + Number(item.bca_payment_amount || 0) + Number(item.bca_payment_usd_amount || 0),
      })),
    [items],
  );

  const resetEditor = () => {
    setEditingId(null);
    setDraft(defaultDraft);
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, rowId: EditableRowId) => {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    event.preventDefault();
    if (isBusy) return;
    void handleSave(rowId);
  };

  const handleAddRow = () => {
    if (disabled || isBusy) return;
    setEditingId('new');
    setDraft(defaultDraft);
  };

  const handleEditRow = (item: FinanceBillingItem) => {
    if (disabled || isBusy) return;
    setEditingId(item.id);
    setDraft({
      note: item.note || '',
      amount: Number(item.cash_payment_amount || 0) + Number(item.bca_payment_amount || 0) + Number(item.bca_payment_usd_amount || 0),
    });
  };

  const handleToggleSelected = (id: number, checked: boolean) => {
    setSelectedIds((previous) => (checked ? [...previous, id] : previous.filter((itemId) => itemId !== id)));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  const handleDeleteOne = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Rincian transaksi berhasil dihapus');
      setSelectedIds((previous) => previous.filter((itemId) => itemId !== id));
      if (editingId === id) {
        resetEditor();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus rincian transaksi'));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteMutation.mutateAsync(id)));
      toast.success('Rincian transaksi terpilih berhasil dihapus');
      setSelectedIds([]);
      resetEditor();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menghapus rincian transaksi'));
    }
  };

  const handleSave = async (rowId: EditableRowId) => {
    if (!financeBillingId || !paymentAt) {
      toast.error('Data finance billing belum lengkap');
      return;
    }

    if (!draft.note.trim()) {
      toast.error('Keterangan wajib diisi');
      return;
    }

    if (draft.amount <= 0) {
      toast.error('Nominal bayar wajib lebih dari 0');
      return;
    }

    try {
      if (rowId === 'new') {
        await createMutation.mutateAsync({
          id: financeBillingId,
          payload: {
            finance_billing_id: financeBillingId,
            cash_payment_amount: draft.amount,
            payment_at: paymentAt,
            note: draft.note.trim(),
          },
        });
        toast.success('Rincian transaksi berhasil ditambahkan');
      } else {
        await updateMutation.mutateAsync({
          id: rowId,
          payload: {
            finance_billing_id: financeBillingId,
            cash_payment_amount: draft.amount,
            payment_at: paymentAt,
            note: draft.note.trim(),
          },
        });
        toast.success('Rincian transaksi berhasil diperbarui');
      }

      resetEditor();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Gagal menyimpan rincian transaksi'));
    }
  };

  const columns: ColumnDef<FinanceBillingItem & { totalAmount: number }>[] = [
    {
      header: (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
          disabled={disabled || !hasRows || isBusy}
        />
      ),
      alignment: 'center',
      headerClassName: 'w-12 px-4 py-3',
      className: 'w-12 px-4 py-3',
      cell: (item) => (
        <Checkbox
          checked={selectedIds.includes(item.id)}
          onCheckedChange={(checked) => handleToggleSelected(item.id, Boolean(checked))}
          disabled={disabled || isBusy || editingId === item.id}
        />
      ),
    },
    {
      header: 'No',
      alignment: 'left',
      headerClassName: 'w-16 px-4 py-3',
      className: 'w-16 px-4 py-3',
      cell: (_, index) => <span className="text-slate-600">{index + 1}</span>,
    },
    {
      header: 'Keterangan',
      alignment: 'left',
      className: 'px-4 py-3',
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <Input
              value={draft.note}
              onChange={(event) => setDraft((previous) => ({ ...previous, note: event.target.value }))}
              onKeyDown={(event) => handleEditorKeyDown(event, item.id)}
              placeholder="Tulis rincian transaksi"
              className="h-11 rounded-md border-slate-200"
            />
          );
        }
        return <span className="text-slate-800">{item.note || '-'}</span>;
      },
    },
    {
      header: 'Nominal Bayar',
      alignment: 'left',
      headerClassName: 'w-[320px] px-4 py-3',
      className: 'w-[320px] px-4 py-3',
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <MoneyInput
              value={draft.amount}
              onChangeValue={(value) => setDraft((previous) => ({ ...previous, amount: value }))}
              onKeyDown={(event) => handleEditorKeyDown(event, item.id)}
              placeholder="Masukkan nominal bayar"
              className="h-11 rounded-md border-slate-200"
            />
          );
        }
        return <span className="font-medium text-slate-900">{formatCurrency(item.totalAmount)}</span>;
      },
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      headerClassName: 'w-20 px-4 py-3',
      className: 'w-20 px-4 py-3',
      cell: (item) => {
        const isEditing = editingId === item.id;
        if (isEditing) {
          return (
            <div className="flex items-center justify-center gap-2">
              <Button type="button" size="sm" className="h-9 rounded-lg bg-[#18385b] px-3 hover:bg-[#102843]" disabled={isBusy} onClick={() => void handleSave(item.id)}>
                Simpan
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-slate-200 px-3" disabled={isBusy} onClick={resetEditor}>
                Batal
              </Button>
            </div>
          );
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={disabled || isBusy}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem onClick={() => handleEditRow(item)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleDeleteOne(item.id)} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const newRowFooter = editingId === 'new' ? (
    <tfoot>
      <tr className="bg-slate-50/60">
        <td className="px-4 py-3 text-center w-12 border-t border-slate-200">
          <Checkbox checked={false} disabled />
        </td>
        <td className="px-4 py-3 text-slate-600 w-16 border-t border-slate-200">{rows.length + 1}</td>
        <td className="px-4 py-3 border-t border-slate-200">
          <Input
            value={draft.note}
            onChange={(event) => setDraft((previous) => ({ ...previous, note: event.target.value }))}
            onKeyDown={(event) => handleEditorKeyDown(event, 'new')}
            placeholder="Tulis rincian transaksi"
            className="h-11 rounded-md border-slate-200 bg-white"
          />
        </td>
        <td className="px-4 py-3 w-[320px] border-t border-slate-200">
          <MoneyInput
            value={draft.amount}
            onChangeValue={(value) => setDraft((previous) => ({ ...previous, amount: value }))}
            onKeyDown={(event) => handleEditorKeyDown(event, 'new')}
            placeholder="Masukkan nominal bayar"
            className="h-11 rounded-md border-slate-200 bg-white"
          />
        </td>
        <td className="px-4 py-3 text-center w-20 sticky right-0 bg-slate-50/60 z-10 border-l border-t border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-center gap-2">
            <Button type="button" size="sm" className="h-9 rounded-lg bg-[#18385b] px-3 hover:bg-[#102843]" disabled={isBusy} onClick={() => void handleSave('new')}>
              Simpan
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-slate-200 px-3" disabled={isBusy} onClick={resetEditor}>
              Batal
            </Button>
          </div>
        </td>
      </tr>
    </tfoot>
  ) : undefined;

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Detail Transaksi</h2>
          <p className="text-sm text-muted-foreground">Rincian lengkap unit yang dibeli</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || isBusy || selectedIds.length === 0}
            onClick={() => void handleDeleteSelected()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedIds.length})
          </Button>
          <Button type="button" disabled={disabled || isBusy || editingId === 'new'} onClick={handleAddRow} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data Transaksi
          </Button>
        </div>
      </div>

      {disabled && (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Detail transaksi inline hanya tersedia untuk data transaksi kas harian yang berasal dari fractal pembayaran.
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>Show</span>
          <div className="flex h-11 w-[58px] items-center justify-center rounded-md border border-slate-200 bg-white">10</div>
          <span>Page</span>
        </div>

        <BaseTable
          data={rows}
          columns={columns}
          footer={newRowFooter}
          containerClassName="rounded-md border border-slate-200 shadow-none overflow-hidden"
          headerRowClassName="bg-[#f3f6fb] text-[13px] font-semibold uppercase text-slate-800 border-b-0"
        />
      </div>
    </div>
  );
}
