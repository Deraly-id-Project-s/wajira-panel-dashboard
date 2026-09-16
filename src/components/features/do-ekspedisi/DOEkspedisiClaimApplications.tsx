import React from 'react';
import { WalletCards, Plus, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { InputDateTime } from '@/components/ui/input-date-time';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import {
  useApplyExpeditionClaim,
  useAvailableExpeditionClaims,
  useDeleteExpeditionClaimApplication,
  useUpdateExpeditionClaimApplication,
} from '@/hooks/useDoEkspedisi';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import type { DoEkspedisi, DoEkspedisiClaim, DoEkspedisiClaimApplication } from '@/@types/do-ekspedisi.types';
import { CopyBox } from '@/components/ui/copy-box';
import { useRouter } from 'next/router';

interface DOEkspedisiClaimApplicationsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    {type === 'datetime-local' ? (
      <InputDateTime value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" />
    ) : type === 'date' ? (
      <InputDate value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" />
    ) : (
      <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2" />
    )}
  </div>
);

function RelatedSection({
  title,
  description,
  icon,
  onAdd,
  addLabel = 'Tambah',
  addDisabled = false,
  helper,
  children,
}: {
  title: string;
  description?: string | null;
  icon: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  helper?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-100 p-2 text-orange-700">{icon}</div>
            <div>
              <h2 className="font-semibold text-slate-950">{title}</h2>
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          {helper && <p className="ml-12 mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        {onAdd && (
          <Button size="sm" onClick={onAdd} disabled={addDisabled} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiClaimApplications({ data, onRefresh }: DOEkspedisiClaimApplicationsProps) {
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [editingApplication, setEditingApplication] = React.useState<DoEkspedisiClaimApplication | null>(null);
  const [applyForm, setApplyForm] = React.useState({
    claimId: '',
    nominal: '' as string | number,
    type: 'cash' as 'cash' | 'transfer',
    date: new Date().toISOString().slice(0, 16),
  });

  const canManageClaims = ['draft', 'pending'].includes(String(data.status).toLowerCase()) && Boolean(data.driverId);
  const canApplyClaims = canManageClaims && data.ujNominal > 0;
  const availableClaims = useAvailableExpeditionClaims(data.driverId, canManageClaims && applyOpen);
  const applyClaim = useApplyExpeditionClaim(data.id);
  const updateClaim = useUpdateExpeditionClaimApplication(data.id);
  const deleteClaim = useDeleteExpeditionClaimApplication(data.id);

  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const usedClaimIds = React.useMemo(
    () => new Set((data.driverExpeditionClaims ?? []).map((item) => String(item.doExpeditionClaimId))),
    [data.driverExpeditionClaims],
  );
  const claimOptions = React.useMemo(() => {
    const optionsById = new Map<number, DoEkspedisiClaim>();

    (availableClaims.data ?? []).forEach((item) => optionsById.set(item.id, item));
    (data.driverExpeditionClaims ?? []).forEach((item) => {
      if (item.claim) optionsById.set(item.claim.id, item.claim);
    });

    return Array.from(optionsById.values());
  }, [availableClaims.data, data.driverExpeditionClaims]);
  const claimSelectOptions = React.useMemo(
    () => claimOptions.map((item) => ({
      value: String(item.id),
      label: item.sourceExpeditionCode || `Ekspedisi #${item.doExpeditionsId}`,
      subtitle: `${item.subject} · Sisa ${formatCurrency(item.remainingNominal)}`,
    })),
    [claimOptions],
  );
  const selectedAvailableClaim = claimOptions.find((item) => String(item.id) === applyForm.claimId);

  const resetForm = () => {
    setEditingApplication(null);
    setApplyForm({ claimId: '', nominal: '', type: 'cash', date: new Date().toISOString().slice(0, 16) });
  };

  const openCreate = () => {
    resetForm();
    setApplyOpen(true);
  };

  const openEdit = (item: DoEkspedisiClaimApplication) => {
    setEditingApplication(item);
    setApplyForm({
      claimId: String(item.doExpeditionClaimId),
      nominal: item.nominal,
      type: item.type,
      date: item.date ? item.date.slice(0, 16) : new Date().toISOString().slice(0, 16),
    });
    setApplyOpen(true);
  };

  const submitClaimApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data.driverId || (!editingApplication && !applyForm.claimId)) return;
    if (!editingApplication && usedClaimIds.has(applyForm.claimId)) {
      toast.error('Claim ini sudah ditambahkan ke DO Ekspedisi.');
      return;
    }

    const nominal = Number(applyForm.nominal);
    const maxAvailableNominal = editingApplication
      ? (editingApplication.claim?.remainingNominal ?? 0) + editingApplication.nominal
      : selectedAvailableClaim?.remainingNominal ?? 0;
    if (nominal < 1 || nominal > maxAvailableNominal || nominal > (data.ujNominal + (editingApplication?.nominal ?? 0))) {
      toast.error('Nominal potongan harus lebih dari 0 dan tidak boleh melebihi sisa claim atau sisa UJ.');
      return;
    }

    try {
      if (editingApplication) {
        await updateClaim.mutateAsync({
          id: editingApplication.id,
          payload: { nominal, type: applyForm.type, date: applyForm.date },
        });
        toast.success('Potongan claim berhasil diperbarui');
      } else {
        await applyClaim.mutateAsync({
          do_expedition_claim_id: Number(applyForm.claimId),
          do_expedition_id: data.id,
          nominal,
          type: applyForm.type,
        });
        toast.success('Claim berhasil dipotong dari UJ driver');
      }
      setApplyOpen(false);
      resetForm();
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (item: DoEkspedisiClaimApplication) => {
    if (!window.confirm('Hapus potongan claim ini?')) return;
    try {
      await deleteClaim.mutateAsync(item.id);
      toast.success('Potongan claim berhasil dihapus');
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: ColumnDef<DoEkspedisiClaimApplication>[] = [
    {
      header: 'Sumber Claim',
      cell: (item) => (
        <div>
          <div className="flex items-center gap-2">
            {item.claim?.sourceExpeditionCode && <CopyBox text={item.claim?.sourceExpeditionCode} href={item.claim?.sourceExpeditionCode ? `/dashboard/${slug}/do-ekspedisi/detail/${item.claim.doExpeditionsId}` : undefined} />}
          </div>
        </div>
      ),
    },
    { header: 'Alasan Claim', cell: (item) => item.claim?.subject || '-' },
    { header: 'Tanggal', cell: (item) => item.date ? formatDate(item.date) : '-' },
    { header: 'Metode', cell: (item) => <Badge variant="outline" className="capitalize">{item.type}</Badge> },
    {
      header: 'Potongan UJ',
      alignment: 'right',
      cell: (item) => <span className="font-semibold text-rose-700">-{formatCurrency(item.nominal)}</span>,
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
            <DropdownMenuItem onClick={() => openEdit(item)} disabled={!canApplyClaims}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(item)} disabled={!canApplyClaims}>
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
        title="Potongan Claim pada UJ"
        icon={<WalletCards />}
        description={'Claim dari ekspedisi mana pun milik driver yang sama dapat digunakan sebagai potongan UJ.'}
        onAdd={openCreate}
        addLabel="Terapkan Claim"
        addDisabled={!canApplyClaims}
      >
        <BaseTable
          data={data.driverExpeditionClaims ?? []}
          columns={columns}
          containerClassName="rounded-md border"
          headerRowClassName="bg-rose-50"
        />
      </RelatedSection>

      <FormDialog
        open={applyOpen}
        onOpenChange={(open) => {
          setApplyOpen(open);
          if (!open) resetForm();
        }}
        title={editingApplication ? 'Edit Potongan Claim' : 'Terapkan Claim ke UJ'}
        description="Pilih tagihan driver yang akan dipotong dari uang jalan ekspedisi ini."
        onSubmit={submitClaimApplication}
        submitLabel={editingApplication ? 'Simpan Perubahan' : 'Terapkan Claim'}
        isSubmitting={applyClaim.isPending || updateClaim.isPending}
        maxWidthClassName="max-w-lg"
      >
        {!editingApplication && (
          <>
            <div className="space-y-1">
              <Label>Claim *</Label>
              <SearchableSelect
                value={applyForm.claimId}
                onChange={(claimId) => {
                  const selected = claimOptions.find((item) => String(item.id) === claimId);
                  setApplyForm((old) => ({
                    ...old,
                    claimId,
                    nominal: selected ? String(Math.min(selected.remainingNominal, data.ujNominal)) : '',
                  }));
                }}
                options={claimSelectOptions}
                placeholder="Pilih claim driver"
                searchPlaceholder="Cari claim..."
                loading={availableClaims.isLoading}
                disabledValues={Array.from(usedClaimIds)}
              />
            </div>
            {availableClaims.isSuccess && availableClaims.data?.length === 0 && (
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Tidak ada claim outstanding untuk driver ini.</p>
            )}
          </>
        )}
        {selectedAvailableClaim && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>Sisa claim: <strong>{formatCurrency(selectedAvailableClaim.remainingNominal)}</strong></p>
            <p>Sisa UJ tersedia: <strong>{formatCurrency(data.ujNominal)}</strong></p>
          </div>
        )}
        <div className="space-y-3">
          <Label>Nominal Potongan *</Label>
          <MoneyInput
            value={applyForm.nominal === '' ? null : Number(applyForm.nominal)}
            onChangeValue={(val) => setApplyForm((old) => ({ ...old, nominal: val }))}
            placeholder="Masukkan nominal potongan"
            className="mt-2"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Metode *</Label>
          <Select value={applyForm.type} onValueChange={(type) => setApplyForm((old) => ({ ...old, type: type as 'cash' | 'transfer' }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {editingApplication && field('Tanggal', applyForm.date, 'Pilih tanggal penerapan claim', (date) => setApplyForm((old) => ({ ...old, date })), 'datetime-local')}
      </FormDialog>
    </>
  );
}
