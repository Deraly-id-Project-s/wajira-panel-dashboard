import React from 'react';
import { CreditCard, MoreVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import type { DriverCashAdvance, DriverCashAdvanceClaim } from '@/@types/driver-cash-advance.types';
import {
  useApplyDriverCashAdvance,
  useDeleteDriverCashAdvanceClaim,
  useDriverCashAdvances,
  useUpdateDriverCashAdvanceClaim,
} from '@/hooks/useDriverCashAdvance';

interface DOEkspedisiCashAdvanceClaimsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

function RelatedSection({
  title,
  description,
  icon,
  onAdd,
  addLabel = 'Tambah',
  addDisabled = false,
  children,
}: {
  title: string;
  description?: string | null;
  icon: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-orange-100 p-2 text-orange-700">{icon}</div>
          <div>
            <h2 className="font-semibold text-slate-950">{title}</h2>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        {onAdd && (
          <Button onClick={onAdd} disabled={addDisabled} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiCashAdvanceClaims({ data, onRefresh }: DOEkspedisiCashAdvanceClaimsProps) {
  const [open, setOpen] = React.useState(false);
  const [editingClaim, setEditingClaim] = React.useState<DriverCashAdvanceClaim | null>(null);
  const [form, setForm] = React.useState({
    cashAdvanceId: '',
    nominal: '' as string | number,
    type: 'cash' as 'cash' | 'transfer',
    date: today(),
  });

  const canManage = ['draft', 'pending'].includes(String(data.status).toLowerCase()) && Boolean(data.driverId);
  const availableCashAdvances = useDriverCashAdvances({
    page: 1,
    perPage: 100,
    driver_id: data.driverId ?? undefined,
    is_claim: false,
    is_approve: true,
    enabled: canManage && open && !editingClaim,
  });
  const applyCashAdvance = useApplyDriverCashAdvance(data.id);
  const updateCashAdvanceClaim = useUpdateDriverCashAdvanceClaim(data.id);
  const deleteCashAdvanceClaim = useDeleteDriverCashAdvanceClaim(data.id);

  const availableItems = React.useMemo(
    () => availableCashAdvances.data?.data ?? [],
    [availableCashAdvances.data?.data],
  );
  const usedCashAdvanceIds = React.useMemo(
    () => new Set((data.driverCashAdvanceClaims ?? []).map((item) => String(item.driverCashAdvanceId))),
    [data.driverCashAdvanceClaims],
  );
  const cashAdvanceOptions = React.useMemo(() => {
    const optionsById = new Map<number, DriverCashAdvance>();

    availableItems.forEach((item) => optionsById.set(item.id, item));
    (data.driverCashAdvanceClaims ?? []).forEach((item) => {
      if (item.cashAdvance) optionsById.set(item.cashAdvance.id, item.cashAdvance);
    });

    return Array.from(optionsById.values());
  }, [availableItems, data.driverCashAdvanceClaims]);
  const cashAdvanceSelectOptions = React.useMemo(
    () => cashAdvanceOptions.map((item) => ({
      value: String(item.id),
      label: `${item.subject || `Kas Bon #${item.id}`} · Sisa ${formatCurrency(item.remainingNominal)}`,
      subtitle: item.code || undefined,
    })),
    [cashAdvanceOptions],
  );
  const selectedCashAdvance = cashAdvanceOptions.find((item) => String(item.id) === form.cashAdvanceId);

  const resetForm = () => {
    setEditingClaim(null);
    setForm({ cashAdvanceId: '', nominal: '', type: 'cash', date: today() });
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item: DriverCashAdvanceClaim) => {
    setEditingClaim(item);
    setForm({
      cashAdvanceId: String(item.driverCashAdvanceId),
      nominal: item.nominal,
      type: item.type,
      date: item.date ? item.date.slice(0, 10) : today(),
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data.driverId || (!editingClaim && !form.cashAdvanceId)) return;
    if (!editingClaim && usedCashAdvanceIds.has(form.cashAdvanceId)) {
      toast.error('Kas bon ini sudah ditambahkan ke DO Ekspedisi.');
      return;
    }

    const nominal = Number(form.nominal);
    const maxAvailableNominal = editingClaim
      ? (editingClaim.cashAdvance?.remainingNominal ?? 0) + editingClaim.nominal
      : selectedCashAdvance?.remainingNominal ?? 0;

    if (nominal < 1 || nominal > maxAvailableNominal || nominal > (data.ujNominal + (editingClaim?.nominal ?? 0))) {
      toast.error('Nominal potongan harus lebih dari 0 dan tidak boleh melebihi sisa kas bon atau sisa UJ.');
      return;
    }

    try {
      if (editingClaim) {
        await updateCashAdvanceClaim.mutateAsync({
          id: editingClaim.id,
          payload: {
            driver_cash_advance_id: Number(form.cashAdvanceId),
            nominal,
            type: form.type,
            date: form.date,
          },
        });
        toast.success('Potongan kas bon berhasil diperbarui');
      } else {
        await applyCashAdvance.mutateAsync({
          driver_cash_advance_id: Number(form.cashAdvanceId),
          do_expedition_id: data.id,
          nominal,
          type: form.type,
          date: form.date,
        });
        toast.success('Kas bon berhasil dipotong dari UJ driver');
      }

      setOpen(false);
      resetForm();
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (item: DriverCashAdvanceClaim) => {
    if (!window.confirm('Hapus potongan kas bon ini?')) return;
    try {
      await deleteCashAdvanceClaim.mutateAsync(item.id);
      toast.success('Potongan kas bon berhasil dihapus');
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: ColumnDef<DriverCashAdvanceClaim>[] = [
    {
      header: 'Kas Bon',
      cell: (x) => (
        <div>
          <p className="font-medium text-slate-900">{x.cashAdvance?.subject || '-'}</p>
          <p className="text-xs text-slate-500">Sisa {formatCurrency(x.cashAdvance?.remainingNominal ?? 0)}</p>
        </div>
      ),
    },
    { header: 'Tanggal', cell: (x) => x.date ? formatDate(x.date) : '-' },
    { header: 'Metode', cell: (x) => <Badge variant="outline" className="capitalize">{x.type}</Badge> },
    {
      header: 'Potongan UJ',
      alignment: 'right',
      cell: (x) => <span className="font-semibold text-rose-700">-{formatCurrency(x.nominal)}</span>,
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(item)} disabled={!canManage}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(item)} disabled={!canManage}>
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <RelatedSection
        title="Potongan Kas Bon pada UJ"
        icon={<CreditCard />}
        description="Kas bon driver yang sudah disetujui dapat digunakan sebagai potongan UJ."
        onAdd={openCreate}
        addLabel="Terapkan Kas Bon"
        addDisabled={!canManage || data.ujNominal <= 0}
      >
        <BaseTable
          data={data.driverCashAdvanceClaims ?? []}
          columns={columns}
          containerClassName="rounded-md border"
          headerRowClassName="bg-blue-50"
        />
      </RelatedSection>

      <FormDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) resetForm();
        }}
        title={editingClaim ? 'Edit Potongan Kas Bon' : 'Terapkan Kas Bon ke UJ'}
        description="Pilih kas bon driver yang akan dipotong dari uang jalan ekspedisi ini."
        onSubmit={submit}
        submitLabel={editingClaim ? 'Simpan Perubahan' : 'Terapkan Kas Bon'}
        isSubmitting={applyCashAdvance.isPending || updateCashAdvanceClaim.isPending}
        maxWidthClassName="max-w-lg"
      >
        {!editingClaim && (
          <>
            <div className="space-y-1">
              <Label>Kas Bon *</Label>
              <SearchableSelect
                value={form.cashAdvanceId}
                onChange={(cashAdvanceId) => {
                  const selected = cashAdvanceOptions.find((item) => String(item.id) === cashAdvanceId);
                  setForm((old) => ({
                    ...old,
                    cashAdvanceId,
                    nominal: selected ? String(Math.min(selected.remainingNominal, data.ujNominal)) : '',
                  }));
                }}
                options={cashAdvanceSelectOptions}
                placeholder="Pilih kas bon driver"
                searchPlaceholder="Cari kas bon..."
                loading={availableCashAdvances.isLoading}
                disabledValues={Array.from(usedCashAdvanceIds)}
              />
            </div>
            {availableCashAdvances.isSuccess && availableItems.length === 0 && (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Tidak ada kas bon outstanding untuk driver ini.</p>
            )}
          </>
        )}
        {selectedCashAdvance && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <p>Sisa kas bon: <strong>{formatCurrency(selectedCashAdvance.remainingNominal)}</strong></p>
            <p>Sisa UJ tersedia: <strong>{formatCurrency(data.ujNominal)}</strong></p>
          </div>
        )}
        <div className="space-y-3">
          <Label>Nominal Potongan *</Label>
          <MoneyInput
            value={form.nominal === '' ? null : Number(form.nominal)}
            onChangeValue={(value) => setForm((old) => ({ ...old, nominal: value }))}
            placeholder="Masukkan nominal potongan"
            className="mt-2"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Metode *</Label>
          <Select value={form.type} onValueChange={(type) => setForm((old) => ({ ...old, type: type as 'cash' | 'transfer' }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Tanggal *</Label>
          <InputDate value={form.date} onChange={(event) => setForm((old) => ({ ...old, date: event.target.value }))} className="mt-2" />
        </div>
      </FormDialog>
    </>
  );
}
