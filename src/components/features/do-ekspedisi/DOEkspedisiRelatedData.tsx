import React from 'react';
import { FileText, MoreVertical, Plus, Receipt, ShieldAlert, Trash2, Pencil, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import { useApplyExpeditionClaim, useAvailableExpeditionClaims, useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import type { DoEkspedisi, DoEkspedisiClaim, DoEkspedisiClaimApplication, DoEkspedisiDriverNote, DoEkspedisiExpense, DoEkspedisiClaimDocumentation } from '@/@types/do-ekspedisi.types';

type Resource = 'note' | 'expense' | 'claim' | 'documentation';
type ActiveEdit = { resource: Resource; item: any } | null;

const field = (label: string, value: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1"><Label>{label}{required && <span className="text-red-500"> *</span>}</Label><Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} /></div>
);

export function DOEkspedisiRelatedData({ data, onRefresh }: { data: DoEkspedisi; onRefresh?: () => void }) {
  const [active, setActive] = React.useState<ActiveEdit>(null);
  const [docClaim, setDocClaim] = React.useState<DoEkspedisiClaim | null>(null);
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [applyForm, setApplyForm] = React.useState({ claimId: '', nominal: '', type: 'cash' as 'cash' | 'transfer', date: new Date().toISOString().slice(0, 16) });
  const [form, setForm] = React.useState<Record<string, any>>({});
  const note = useDoDetailResourceMutation('note', data.id);
  const expense = useDoDetailResourceMutation('expense', data.id);
  const claim = useDoDetailResourceMutation('claim', data.id);
  const documentation = useDoDetailResourceMutation('documentation', data.id);
  const canManageClaims = data.status === 'done' && Boolean(data.driverId);
  const canApplyClaims = canManageClaims && data.ujNominal > 0;
  const availableClaims = useAvailableExpeditionClaims(data.driverId, canManageClaims && applyOpen);
  const applyClaim = useApplyExpeditionClaim(data.id);
  const mutations = { note, expense, claim, documentation }[active?.resource ?? 'note'];

  const openCreate = (resource: Resource, extra: Record<string, any> = {}) => { setActive({ resource, item: null }); setForm(extra); };
  const openEdit = (resource: Resource, item: any) => {
    setActive({ resource, item });
    setForm(resource === 'note' ? { effective_date: item.effectiveDate?.slice(0, 16), subject: item.subject, description: item.description } : resource === 'expense' ? { subject: item.subject, description: item.description, nominal: String(item.nominal) } : resource === 'claim' ? { driver_id: String(item.driverId), subject: item.subject, description: item.description, claim_nominal: String(item.claimNominal) } : { caption: item.caption });
  };
  const close = () => { setActive(null); setDocClaim(null); setForm({}); };
  const set = (key: string, value: any) => setForm((old) => ({ ...old, [key]: value }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!active) return;
    try {
      let payload: Record<string, unknown> | FormData = { ...form };
      if (active.resource === 'note' || active.resource === 'documentation') {
        const fd = new FormData(); Object.entries(form).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') fd.append(key, value instanceof File ? value : String(value)); });
        if (active.resource === 'note') fd.append('do_expeditions_id', String(data.id));
        else fd.append('do_expedition_claim_id', String(docClaim?.id));
        payload = fd;
      } else if (active.resource === 'expense') payload = { ...form, do_expeditions_id: data.id, nominal: Number(form.nominal) };
      else payload = { ...form, do_expeditions_id: data.id, driver_id: Number(form.driver_id), claim_nominal: Number(form.claim_nominal) };
      if (active.item) await mutations.update.mutateAsync({ id: active.item.id, payload }); else await mutations.create.mutateAsync(payload);
      toast.success('Data berhasil disimpan'); close(); onRefresh?.();
    } catch (error: any) { toast.error(error?.message || 'Gagal menyimpan data'); }
  };
  const remove = async (resource: Resource, item: any) => { if (!window.confirm('Hapus data ini?')) return; try { await ({ note, expense, claim, documentation }[resource].remove.mutateAsync(item.id)); toast.success('Data berhasil dihapus'); onRefresh?.(); } catch (error: any) { toast.error(error?.message || 'Gagal menghapus data'); } };
  const actions = (resource: Resource, item: any) => <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(resource, item)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>{(resource !== 'claim' || Number(item.appliedNominal) === 0) && <DropdownMenuItem className="text-red-600" onClick={() => void remove(resource, item)}><Trash2 className="mr-2 h-4 w-4" />Hapus</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>;

  const noteColumns: ColumnDef<DoEkspedisiDriverNote>[] = [{ header: 'No', cell: (_, i) => i + 1 }, { header: 'Tanggal Efektif', cell: (x) => x.effectiveDate ? formatDate(x.effectiveDate) : '-' }, { header: 'Subject', cell: (x) => x.subject }, { header: 'Deskripsi', cell: (x) => x.description }, { header: '', alignment: 'right', cell: (x) => actions('note', x) }];
  const expenseColumns: ColumnDef<DoEkspedisiExpense>[] = [{ header: 'No', cell: (_, i) => i + 1 }, { header: 'Subject', cell: (x) => x.subject }, { header: 'Deskripsi', cell: (x) => x.description }, { header: 'Nominal', alignment: 'right', cell: (x) => formatCurrency(x.nominal) }, { header: '', alignment: 'right', cell: (x) => actions('expense', x) }];
  const claimColumns: ColumnDef<DoEkspedisiClaim>[] = [{ header: 'No', cell: (_, i) => i + 1 }, { header: 'Subject', cell: (x) => x.subject }, { header: 'Deskripsi', cell: (x) => x.description }, { header: 'Claim', alignment: 'right', cell: (x) => formatCurrency(x.claimNominal) }, { header: 'Terpakai', alignment: 'right', cell: (x) => formatCurrency(x.appliedNominal) }, { header: 'Sisa', alignment: 'right', cell: (x) => formatCurrency(x.remainingNominal) }, { header: 'Dokumentasi', cell: (x) => <Button variant="link" className="p-0" onClick={() => setDocClaim(x)}>{x.documentations?.length ?? 0} file</Button> }, { header: '', alignment: 'right', cell: (x) => actions('claim', x) }];
  const applicationColumns: ColumnDef<DoEkspedisiClaimApplication>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    { header: 'Sumber Claim', cell: (x) => <div><p className="font-medium text-slate-900">{x.claim?.sourceExpeditionCode || '-'}</p><p className="text-xs text-slate-500">{x.claim?.subject || '-'}</p></div> },
    { header: 'Tanggal', cell: (x) => x.date ? formatDate(x.date) : '-' },
    { header: 'Metode', cell: (x) => <Badge variant="outline" className="capitalize">{x.type}</Badge> },
    { header: 'Potongan UJ', alignment: 'right', cell: (x) => <span className="font-semibold text-rose-700">-{formatCurrency(x.nominal)}</span> },
  ];
  const docs = docClaim?.documentations ?? [];
  const docColumns: ColumnDef<DoEkspedisiClaimDocumentation>[] = [{ header: 'No', cell: (_, i) => i + 1 }, { header: 'Caption', cell: (x) => x.caption }, { header: 'File', cell: (x) => x.image || '-' }, { header: '', alignment: 'right', cell: (x) => actions('documentation', x) }];
  const title = active?.resource === 'note' ? 'Driver Note' : active?.resource === 'expense' ? 'Biaya Perjalanan' : active?.resource === 'claim' ? 'Driver Claim' : 'Dokumentasi Claim';
  const busy = Boolean(mutations?.create.isPending || mutations?.update.isPending);
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

  return <div className="space-y-6">
    <RelatedSection title="Driver Notes" icon={<FileText />} onAdd={() => openCreate('note', { effective_date: new Date().toISOString().slice(0, 16) })}><BaseTable data={data.driverNotes} columns={noteColumns} containerClassName="rounded-lg border" headerRowClassName="bg-orange-50" /></RelatedSection>
    <RelatedSection title="DO Expense" icon={<Receipt />} onAdd={() => openCreate('expense', { nominal: '' })}><BaseTable data={data.expeditionExpenses} columns={expenseColumns} containerClassName="rounded-lg border" headerRowClassName="bg-orange-50" /></RelatedSection>
    <RelatedSection title="Driver Claim" icon={<ShieldAlert />} onAdd={() => openCreate('claim', { driver_id: String(data.driverId ?? '') })} addDisabled={!canManageClaims} helper={!canManageClaims ? 'Claim baru hanya dapat dibuat setelah ekspedisi selesai.' : undefined}><BaseTable data={data.expeditionClaims} columns={claimColumns} containerClassName="rounded-lg border" headerRowClassName="bg-orange-50" /></RelatedSection>
    <RelatedSection title="Potongan Claim pada UJ" icon={<WalletCards />} onAdd={() => setApplyOpen(true)} addLabel="Terapkan Claim" addDisabled={!canApplyClaims} helper={!canManageClaims ? 'Selesaikan ekspedisi dan pastikan driver terpasang sebelum menerapkan claim.' : data.ujNominal <= 0 ? 'UJ driver sudah habis terpotong claim.' : 'Claim dari ekspedisi mana pun milik driver yang sama dapat digunakan sebagai potongan UJ.'}><BaseTable data={data.driverExpeditionClaims} columns={applicationColumns} containerClassName="rounded-lg border" headerRowClassName="bg-rose-50" /></RelatedSection>
    <FormDialog open={Boolean(active)} onOpenChange={(open) => !open && close()} title={title} description="Lengkapi data transaksi perjalanan" onSubmit={save} isSubmitting={busy} maxWidthClassName="max-w-lg">
      {active?.resource === 'note' && <>{field('Tanggal Efektif', form.effective_date ?? '', (v) => set('effective_date', v), 'datetime-local')}{field('Subject', form.subject ?? '', (v) => set('subject', v))}<div className="space-y-1"><Label>Gambar</Label><FileInput accept="image/*" value={form.image ?? null} onFileChange={(file) => set('image', file)} /></div><div className="space-y-1"><Label>Deskripsi</Label><Textarea required value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div></>}
      {active?.resource === 'expense' && <>{field('Subject', form.subject ?? '', (v) => set('subject', v))}<div className="space-y-1"><Label>Deskripsi *</Label><Textarea required value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>{field('Nominal', form.nominal ?? '', (v) => set('nominal', v), 'number')}</>}
      {active?.resource === 'claim' && <><div className="space-y-1"><Label>Driver</Label><Input value={data.driver?.name || `Driver #${data.driverId ?? '-'}`} disabled /></div>{field('Subject', form.subject ?? '', (v) => set('subject', v))}<div className="space-y-1"><Label>Deskripsi *</Label><Textarea required value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>{field('Nominal Claim', form.claim_nominal ?? '', (v) => set('claim_nominal', v), 'number')}</>}
      {active?.resource === 'documentation' && <><div className="space-y-1"><Label>Gambar {!active.item && <span className="text-red-500">*</span>}</Label><FileInput required={!active.item} accept="image/*" value={form.image ?? null} onFileChange={(file) => set('image', file)} /></div>{field('Caption', form.caption ?? '', (v) => set('caption', v))}</>}
    </FormDialog>
    <FormDialog open={Boolean(docClaim)} onOpenChange={(open) => !open && setDocClaim(null)} title="Dokumentasi Claim" description="Lampiran kerusakan atau kehilangan barang" onSubmit={(e) => { e.preventDefault(); }} submitLabel="Tutup" cancelLabel="Tutup" maxWidthClassName="max-w-3xl"><div className="space-y-4"><div className="flex justify-end"><Button type="button" onClick={() => openCreate('documentation')}><Plus className="mr-2 h-4 w-4" />Tambah Dokumentasi</Button></div><BaseTable data={docs} columns={docColumns} containerClassName="rounded-lg border" headerRowClassName="bg-orange-50" /></div></FormDialog>
    <FormDialog open={applyOpen} onOpenChange={setApplyOpen} title="Terapkan Claim ke UJ" description="Pilih tagihan driver yang akan dipotong dari uang jalan ekspedisi ini." onSubmit={submitClaimApplication} submitLabel="Terapkan Claim" isSubmitting={applyClaim.isPending} maxWidthClassName="max-w-lg">
      <div className="space-y-1"><Label>Claim *</Label><Select value={applyForm.claimId} onValueChange={(claimId) => { const selected = availableClaims.data?.find((item) => String(item.id) === claimId); setApplyForm((old) => ({ ...old, claimId, nominal: selected ? String(Math.min(selected.remainingNominal, data.ujNominal)) : '' })); }}><SelectTrigger><SelectValue placeholder={availableClaims.isLoading ? 'Memuat claim...' : 'Pilih claim driver'} /></SelectTrigger><SelectContent>{availableClaims.data?.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.sourceExpeditionCode || `Ekspedisi #${item.doExpeditionsId}`} · {item.subject} · Sisa {formatCurrency(item.remainingNominal)}</SelectItem>)}</SelectContent></Select></div>
      {availableClaims.isSuccess && availableClaims.data?.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Tidak ada claim outstanding untuk driver ini.</p>}
      {selectedAvailableClaim && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>Sisa claim: <strong>{formatCurrency(selectedAvailableClaim.remainingNominal)}</strong></p><p>Sisa UJ tersedia: <strong>{formatCurrency(data.ujNominal)}</strong></p></div>}
      {field('Nominal Potongan', applyForm.nominal, (nominal) => setApplyForm((old) => ({ ...old, nominal })), 'number')}
      <div className="space-y-1"><Label>Metode *</Label><Select value={applyForm.type} onValueChange={(type) => setApplyForm((old) => ({ ...old, type: type as 'cash' | 'transfer' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent></Select></div>
      {field('Tanggal', applyForm.date, (date) => setApplyForm((old) => ({ ...old, date })), 'datetime-local')}
    </FormDialog>
  </div>;
}

function RelatedSection({ title, icon, onAdd, children, addDisabled = false, addLabel = 'Tambah', helper }: { title: string; icon: React.ReactNode; onAdd: () => void; children: React.ReactNode; addDisabled?: boolean; addLabel?: string; helper?: string }) { return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-3"><div><div className="flex items-center gap-3"><div className="rounded-lg bg-orange-100 p-2 text-orange-700">{icon}</div><h2 className="font-semibold text-slate-950">{title}</h2></div>{helper && <p className="ml-12 mt-1 text-xs text-slate-500">{helper}</p>}</div><Button size="sm" onClick={onAdd} disabled={addDisabled}><Plus className="mr-2 h-4 w-4" />{addLabel}</Button></div>{children}</section>; }
