import * as React from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompany } from '@/contexts/CompanyContext';
import { useKas } from '@/hooks/useKas';
import { LoadingState } from '@/components/ui/loading-state';
import {
  useBBNBillBillingItems,
  useBBNBillBillings,
  useBBNBillDetail,
  useCreateBBNBillBilling,
  useCreateBBNBillBillingItem,
  useDeleteBBNBillBilling,
  useDeleteBBNBillBillingItem,
  useUpdateBBNBillBillingItem,
} from '@/hooks/useBBNBill';
import {
  calculateOutstanding,
  formatBillCode,
  formatCurrency,
  getCashLabel,
  toDateValue,
  toPayloadDate,
} from '@/components/features/tagihan-bbn/utils';

type FormValues = {
  paidDate?: Date;
  cashId: string;
  amount: number;
};

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-900">{label}</Label>
      <Input value={value} readOnly className="rounded-md border-slate-200 bg-white text-slate-500 shadow-sm" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4 text-[20px] font-semibold text-slate-900">{title}</div>
      {children}
    </Card>
  );
}

export default function BBNBillPaymentPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  const itemId = typeof router.query.itemId === 'string' ? Number(router.query.itemId) : null;
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';

  const detailQuery = useBBNBillDetail(id);
  const billingsQuery = useBBNBillBillings({ page: 1, perPage: 1000 });
  const billingItemsQuery = useBBNBillBillingItems({ page: 1, perPage: 1000 });
  const kasQuery = useKas(safeCompanyId);
  const createBillingMutation = useCreateBBNBillBilling();
  const deleteBillingMutation = useDeleteBBNBillBilling();
  const createItemMutation = useCreateBBNBillBillingItem();
  const updateItemMutation = useUpdateBBNBillBillingItem();
  const deleteItemMutation = useDeleteBBNBillBillingItem();

  const form = useForm<FormValues>({
    defaultValues: {
      paidDate: undefined,
      cashId: '',
      amount: 0,
    },
  });

  const billingMaster = React.useMemo(() => {
    const currentId = Number(id || 0);
    const fromList = (billingsQuery.data?.data ?? []).find((item) => item.bbnBillId === currentId);
    if (fromList) return fromList;
    const fromDetail = detailQuery.data?.billings?.[0];
    return fromDetail
      ? {
        id: fromDetail.id,
        uuid: fromDetail.uuid,
        bbnBillId: fromDetail.bbnBillId,
        totalPayment: fromDetail.totalPayment,
        createdAt: fromDetail.createdAt,
        updatedAt: fromDetail.updatedAt,
        bbnBill: null,
      }
      : null;
  }, [billingsQuery.data?.data, detailQuery.data?.billings, id]);

  const paymentItems = React.useMemo(() => {
    if (!billingMaster) return [];
    return (billingItemsQuery.data?.data ?? []).filter((item) => item.bbnBillBillingId === billingMaster.id);
  }, [billingItemsQuery.data?.data, billingMaster]);

  const currentItem = React.useMemo(() => {
    if (!itemId) return null;
    return paymentItems.find((item) => item.id === itemId) ?? null;
  }, [itemId, paymentItems]);

  const cashOptions = React.useMemo(() => {
    const cashes = kasQuery.data?.data ?? [];
    const unique = new Map<string, { id: number; label: string }>();
    cashes.forEach((cash) => {
      const label = getCashLabel(cash);
      if (!unique.has(label)) unique.set(label, { id: Number(cash.id), label });
    });
    const order = ['BCA USD', 'BCA IDR', 'CASH IDR'];
    return Array.from(unique.values()).sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  }, [kasQuery.data?.data]);

  const cashLabelMap = React.useMemo(() => {
    const map = new Map<number, string>();
    cashOptions.forEach((cash) => map.set(cash.id, cash.label));
    return map;
  }, [cashOptions]);

  React.useEffect(() => {
    const defaultCashId = currentItem?.cashId ? String(currentItem.cashId) : cashOptions[0] ? String(cashOptions[0].id) : '';
    const defaultAmount = currentItem?.amount ?? calculateOutstanding(detailQuery.data?.bruttoAmount || 0, detailQuery.data?.paidAmount || 0);
    form.reset({
      paidDate: toDateValue(currentItem?.paidDate),
      cashId: defaultCashId,
      amount: defaultAmount,
    });
  }, [cashOptions, currentItem?.amount, currentItem?.cashId, currentItem?.paidDate, detailQuery.data?.bruttoAmount, detailQuery.data?.paidAmount, form]);

  const aggregatedFees = React.useMemo(() => {
    const vehicles = detailQuery.data?.dealerDetail?.vehicleDatas ?? [];
    return vehicles.reduce(
      (acc, vehicle) => {
        const registration = vehicle.vehicleRegistration;
        acc.bbn += registration?.bbnRegistrationFee || 0;
        acc.garwil += registration?.garwilFee || 0;
        acc.nik += registration?.nikValidationFee || 0;
        acc.acceleration += registration?.accelerationFee || 0;
        acc.stamp += registration?.stampFee || 0;
        acc.pnbp += registration?.pnbpBpkb || 0;
        acc.skpd += registration?.skpdFee || 0;
        return acc;
      },
      { bbn: 0, garwil: 0, nik: 0, acceleration: 0, stamp: 0, pnbp: 0, skpd: 0 },
    );
  }, [detailQuery.data?.dealerDetail?.vehicleDatas]);

  const paymentBreakdown = React.useMemo(() => {
    return paymentItems.reduce(
      (acc, item) => {
        const label = cashLabelMap.get(Number(item.cashId)) || item.cashLabel || 'Cash';
        if (label === 'BCA USD') acc.usd += Number(item.amount || 0);
        else if (label === 'BCA IDR') acc.bca += Number(item.amount || 0);
        else acc.cash += Number(item.amount || 0);
        return acc;
      },
      { bca: 0, usd: 0, cash: 0 },
    );
  }, [cashLabelMap, paymentItems]);

  const outstanding = calculateOutstanding(detailQuery.data?.bruttoAmount || 0, detailQuery.data?.paidAmount || 0);
  const [proofName, setProofName] = React.useState('');

  return (
    <DashboardLayout>
      {detailQuery.isLoading ? (
        <LoadingState variant="page" />
      ) : detailQuery.isError || !detailQuery.data ? (
        <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-500">Data tagihan BBN tidak ditemukan.</p>
          <button onClick={() => router.back()} className="text-sm text-blue-600 underline">Kembali</button>
        </div>
      ) : (
        <div className="space-y-7">
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-slate-950">Pembayaran STNK &amp; BPKB</h1>
              <p className="mt-1 text-sm text-slate-500">Kelola pembayaran item untuk tagihan {formatBillCode(detailQuery.data.id)}.</p>
            </div>
          </div>

          <Section title="Informasi Pembayaran">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SummaryField label="Nomor Tagihan" value={formatBillCode(detailQuery.data.id)} />
                <SummaryField label="Dealer" value={detailQuery.data.dealer?.name || '-'} />
                <SummaryField label="Total Tagihan" value={formatCurrency(detailQuery.data.bruttoAmount)} />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-4 text-base text-slate-500">Data Harga Administrasi</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryField label="Biaya Daftar BBN" value={formatCurrency(aggregatedFees.bbn)} />
                  <SummaryField label="Biaya Acc Garwil" value={formatCurrency(aggregatedFees.garwil)} />
                  <SummaryField label="Biaya Acc NIK" value={formatCurrency(aggregatedFees.nik)} />
                  <SummaryField label="Biaya Percepatan" value={formatCurrency(aggregatedFees.acceleration)} />
                  <SummaryField label="Biaya Materai (2 materai/berkas)" value={formatCurrency(aggregatedFees.stamp)} />
                  <SummaryField label="Biaya PNBP BPKB" value={formatCurrency(aggregatedFees.pnbp)} />
                  <SummaryField label="Biaya Notice SKPD" value={formatCurrency(aggregatedFees.skpd)} />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <div className="mb-4 border-b border-slate-100 pb-4 text-base text-slate-500">Pembayaran</div>
                <div className="grid gap-4 md:grid-cols-3">
                  <SummaryField label="BCA USD" value={formatCurrency(paymentBreakdown.usd)} />
                  <SummaryField label="BCA IDR" value={formatCurrency(paymentBreakdown.bca)} />
                  <SummaryField label="Cash" value={formatCurrency(paymentBreakdown.cash)} />
                </div>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <div className="mb-4 border-b border-slate-100 pb-4 text-base text-slate-500">Invoice</div>
                <form
                  onSubmit={form.handleSubmit(async (values) => {
                    if (!id) return;
                    try {
                      let targetBillingId = billingMaster?.id;
                      if (!targetBillingId) {
                        const created = await createBillingMutation.mutateAsync({ bbnBillId: id });
                        targetBillingId = created.id;
                      }

                      const payload = {
                        bbnBillBillingId: targetBillingId,
                        paidDate: toPayloadDate(values.paidDate),
                        cashId: values.cashId,
                        amount: values.amount,
                      };

                      if (currentItem) {
                        await updateItemMutation.mutateAsync({ id: currentItem.id, payload });
                        toast.success('Item pembayaran berhasil diperbarui');
                      } else {
                        await createItemMutation.mutateAsync(payload);
                        toast.success('Item pembayaran berhasil ditambahkan');
                      }

                      router.push(`/dashboard/${slug}/tagihan-bbn/${id}`);
                    } catch (error: any) {
                      toast.error(getApiErrorMessage(error));
                    }
                  })}
                  className="space-y-5"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-900">Tanggal</Label>
                      <Controller
                        name="paidDate"
                        control={form.control}
                        render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pilih tanggal" className="rounded-md border-slate-200 shadow-sm" />}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-900">Kas Masuk</Label>
                      <Controller
                        name="cashId"
                        control={form.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="rounded-md border-slate-200 bg-white shadow-sm">
                              <SelectValue placeholder="Pilih kas masuk" />
                            </SelectTrigger>
                            <SelectContent>
                              {cashOptions.map((cash) => (
                                <SelectItem key={cash.id} value={String(cash.id)}>
                                  {cash.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-900">Total Bayar</Label>
                      <Controller
                        name="amount"
                        control={form.control}
                        render={({ field }) => <MoneyInput value={field.value} onChangeValue={field.onChange} placeholder="Rp" className="rounded-md border-slate-200 shadow-sm" />}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <SummaryField label="Kurang Bayar" value={formatCurrency(outstanding)} />
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-slate-900">Upload Bukti Pembayaran</Label>
                      <Input
                        type="file"
                        className="rounded-md border-slate-200 bg-white shadow-sm"
                        onChange={(event) => {
                          setProofName(event.target.files?.[0]?.name || '');
                        }}
                      />
                      <p className="text-xs text-slate-400">
                        {proofName ? `File terpilih: ${proofName}` : 'UI bukti pembayaran sudah disiapkan. Endpoint saat ini belum menyediakan field upload file.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={() => router.back()} className="text-slate-700">
                      Batal
                    </Button>
                    {currentItem ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await deleteItemMutation.mutateAsync(currentItem.id);
                            toast.success('Item pembayaran berhasil dihapus');
                            router.push(`/dashboard/${slug}/tagihan-bbn/${id}`);
                          } catch (error: any) {
                            toast.error(getApiErrorMessage(error));
                          }
                        }}
                        className="rounded-md"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus Item
                      </Button>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={createBillingMutation.isPending || createItemMutation.isPending || updateItemMutation.isPending}
                      className="rounded-md bg-[#16a34a] hover:bg-[#15803d]"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {currentItem ? 'Simpan Perubahan' : 'Bayar'}
                    </Button>
                  </div>
                </form>
              </div>

              {billingMaster ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={paymentItems.length > 0 || deleteBillingMutation.isPending}
                    onClick={async () => {
                      try {
                        await deleteBillingMutation.mutateAsync(billingMaster.id);
                        toast.success('Data penagihan berhasil dihapus');
                        router.push(`/dashboard/${slug}/tagihan-bbn/${id}`);
                      } catch (error: any) {
                        toast.error(getApiErrorMessage(error));
                      }
                    }}
                    className="rounded-md border-slate-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus Data Penagihan
                  </Button>
                </div>
              ) : null}
            </div>
          </Section>
        </div>
      )}
    </DashboardLayout>
  );
}
