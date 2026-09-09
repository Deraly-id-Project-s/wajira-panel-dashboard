import React from 'react';
import { WalletCards, Plus } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import { useApplyExpeditionClaim, useAvailableExpeditionClaims } from '@/hooks/useDoEkspedisi';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import type { DoEkspedisi, DoEkspedisiClaimApplication } from '@/@types/do-ekspedisi.types';

interface DOEkspedisiClaimApplicationsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2" />
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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
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
          <Button size="sm" onClick={onAdd} disabled={addDisabled}>
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
  const [applyForm, setApplyForm] = React.useState({
    claimId: '',
    nominal: '' as string | number,
    type: 'cash' as 'cash' | 'transfer',
    date: new Date().toISOString().slice(0, 16),
  });

  const canManageClaims = data.status === 'done' && Boolean(data.driverId);
  const canApplyClaims = canManageClaims && data.ujNominal > 0;
  const availableClaims = useAvailableExpeditionClaims(data.driverId, canManageClaims && applyOpen);
  const applyClaim = useApplyExpeditionClaim(data.id);

  const selectedAvailableClaim = availableClaims.data?.find((item) => String(item.id) === applyForm.claimId);

  const submitClaimApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data.driverId || !applyForm.claimId) return;

    const nominal = Number(applyForm.nominal);
    if (!selectedAvailableClaim || nominal < 1 || nominal > selectedAvailableClaim.remainingNominal || nominal > data.ujNominal) {
      toast.error('Nominal potongan harus lebih dari 0 dan tidak boleh melebihi sisa claim atau sisa UJ.');
      return;
    }

    try {
      await applyClaim.mutateAsync({
        do_expedition_claim_id: Number(applyForm.claimId),
        do_expedition_id: data.id,
        driver_id: data.driverId,
        nominal,
        type: applyForm.type,
        date: applyForm.date,
      });
      toast.success('Claim berhasil dipotong dari UJ driver');
      setApplyOpen(false);
      setApplyForm({ claimId: '', nominal: '', type: 'cash', date: new Date().toISOString().slice(0, 16) });
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const columns: ColumnDef<DoEkspedisiClaimApplication>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    {
      header: 'Sumber Claim',
      cell: (x) => (
        <div>
          <p className="font-medium text-slate-900">{x.claim?.sourceExpeditionCode || '-'}</p>
          <p className="text-xs text-slate-500">{x.claim?.subject || '-'}</p>
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
  ];

  return (
    <>
      <RelatedSection
        title="Potongan Claim pada UJ"
        icon={<WalletCards />}
        description={'Claim dari ekspedisi mana pun milik driver yang sama dapat digunakan sebagai potongan UJ.'}
        onAdd={() => setApplyOpen(true)}
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
        onOpenChange={setApplyOpen}
        title="Terapkan Claim ke UJ"
        description="Pilih tagihan driver yang akan dipotong dari uang jalan ekspedisi ini."
        onSubmit={submitClaimApplication}
        submitLabel="Terapkan Claim"
        isSubmitting={applyClaim.isPending}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-1">
          <Label>Claim *</Label>
          <Select
            value={applyForm.claimId}
            onValueChange={(claimId) => {
              const selected = availableClaims.data?.find((item) => String(item.id) === claimId);
              setApplyForm((old) => ({
                ...old,
                claimId,
                nominal: selected ? String(Math.min(selected.remainingNominal, data.ujNominal)) : '',
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={availableClaims.isLoading ? 'Memuat claim...' : 'Pilih claim driver'} />
            </SelectTrigger>
            <SelectContent>
              {availableClaims.data?.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.sourceExpeditionCode || `Ekspedisi #${item.doExpeditionsId}`} · {item.subject} · Sisa {formatCurrency(item.remainingNominal)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {availableClaims.isSuccess && availableClaims.data?.length === 0 && (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Tidak ada claim outstanding untuk driver ini.</p>
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
        {field('Tanggal', applyForm.date, 'Pilih tanggal penerapan claim', (date) => setApplyForm((old) => ({ ...old, date })), 'datetime-local')}
      </FormDialog>
    </>
  );
}
