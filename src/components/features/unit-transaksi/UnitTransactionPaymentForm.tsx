import { useState, useEffect, useMemo } from 'react';

import { Wallet, Trash, Upload, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UnitBilling, UnitBillingHistory } from '@/@types/unit-billing.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { FileInput } from '@/components/ui/file-input';
import { MoneyInput } from '@/components/ui/money-input';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { TextTruncate } from '@/components/ui/text-truncate';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import {
    getHistoryBcaIdrAmount,
    getHistoryCashIdrAmount,
    getHistoryUsdAmount,
    getHistoryTotalIdrEquivalent
} from '@/utils/payment-helpers';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Textarea } from '@/components/ui/textarea';
import { parseAndClampMoneyInput } from '@/lib/utils/money-input';
import { formatDate } from '@/lib/utils/format';
import { CollapsibleBox } from '@/components/ui/collapsible-box';

const paymentSchema = z.object({
    bcaPayment: z.union([z.string(), z.number()]).transform(v => Number(v) || 0).pipe(z.number().min(0, 'Tidak boleh negatif')),
    cashPayment: z.number().min(0, 'Tidak boleh negatif'),
    bcaPayment2: z.number().min(0, 'Tidak boleh negatif'),
    paymentDate: z.string().min(1, 'Tanggal wajib diisi'),
    note: z.string().max(255, 'Maksimal 255 karakter'),
    paymentProof: z.any().optional(),
    isPaid: z.boolean(),
});

export type PaymentFormData = z.input<typeof paymentSchema>;

interface Props {
    type: 'purchase' | 'sales';
    code: string;
    totalTagihan: number;
    totalPpn: number;
    totalDpp?: number;
    totalTagihanUsd?: number;
    totalTagihanUsdActual?: number;
    billing: UnitBilling | null;
    histories: UnitBillingHistory[];
    onSubmitPayment: (data: PaymentFormData) => Promise<void>;
    onDeleteHistory?: (id: string | number) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    canSubmit?: boolean;
    validationMessage?: string;
}

export function UnitTransactionPaymentForm({
    type,
    code,
    totalTagihan,
    totalPpn,
    totalDpp,
    totalTagihanUsd,
    totalTagihanUsdActual,
    billing,
    histories,
    onSubmitPayment,
    onDeleteHistory,
    onCancel,
    loading,
    canSubmit = true,
    validationMessage,
}: Props) {
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const isPurchase = type === 'purchase';

    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            bcaPayment: 0,
            cashPayment: 0,
            bcaPayment2: 0,
            paymentDate: new Date().toISOString().slice(0, 10),
            note: '',
            isPaid: false,
        },
    });

    const historyPaid = (histories ?? []).reduce(
        (acc, item) => acc + getHistoryTotalIdrEquivalent(item),
        0,
    );
    const totalPaidFromBilling = Number(billing?.total_paid ?? (Number(billing?.bca_payment ?? 0) + Number(billing?.cash_payment ?? 0) + Number(billing?.bca_payment_2 ?? 0)));
    const totalPaid = Math.max(totalPaidFromBilling, historyPaid);
    const billingRemaining = Number(billing?.remaining_payment ?? 0);
    const remainingPayment = billing?.is_paid ? 0 : billingRemaining > 0 ? billingRemaining : Math.max(0, totalTagihan - totalPaid);
    const isPaidAndValid = billing ? billing?.is_paid : false;

    const paymentBca = Number(form.watch('bcaPayment') ?? 0); // BCA USD
    const paymentCash = Number(form.watch('cashPayment') ?? 0); // CASH IDR
    const paymentBca2 = Number(form.watch('bcaPayment2') ?? 0); // BCA IDR
    const totalPaymentInputIdr = paymentCash + paymentBca2;

    const maxBca2 = Math.max(0, remainingPayment - paymentCash);
    const maxCash = Math.max(0, remainingPayment - paymentBca2);

    const projectedTotalPaid = useMemo(() => totalPaid + totalPaymentInputIdr, [totalPaid, totalPaymentInputIdr]);
    const projectedRemaining = Math.max(0, totalTagihan - projectedTotalPaid);

    const totalPaidUsdFromHistory = useMemo(() => (histories ?? []).reduce((acc, item) => acc + getHistoryUsdAmount(item), 0), [histories]);
    const projectedTotalPaidUsd = useMemo(() => totalPaidUsdFromHistory + paymentBca, [totalPaidUsdFromHistory, paymentBca]);

    const totalTagihanUsdVal = totalTagihanUsdActual && totalTagihanUsdActual > 0 ? totalTagihanUsdActual : (totalTagihanUsd ?? 0);
    const billingRemainingUsd = Number(billing?.remaining_payment_usd ?? 0);
    const remainingPaymentUsd = billing?.is_paid ? 0 : billingRemainingUsd > 0 ? billingRemainingUsd : Math.max(0, totalTagihanUsdVal - totalPaidUsdFromHistory);

    const projectedRemainingUsd = useMemo(() => Math.max(0, remainingPaymentUsd - paymentBca), [remainingPaymentUsd, paymentBca]);

    const displayDpp = totalDpp !== undefined ? totalDpp : Math.max(0, totalTagihan - totalPpn);

    useEffect(() => {
        const autoIsPaid = projectedTotalPaid >= totalTagihan && totalTagihan > 0;
        form.setValue('isPaid', autoIsPaid);
    }, [form, projectedTotalPaid, totalTagihan]);

    const resetForm = () => {
        form.reset({
            bcaPayment: 0,
            cashPayment: 0,
            bcaPayment2: 0,
            paymentDate: new Date().toISOString().slice(0, 10),
            note: '',
            isPaid: projectedTotalPaid >= totalTagihan && totalTagihan > 0,
        });
    };

    const handleSubmit = async (values: PaymentFormData) => {
        const bcaPaymentUsd = Number(values.bcaPayment || 0);
        const totalIdr = (values.cashPayment || 0) + (values.bcaPayment2 || 0);

        if (bcaPaymentUsd <= 0 && totalIdr <= 0) {
            toast.error('Minimal salah satu nominal pembayaran harus lebih dari 0.');
            return;
        }

        if (remainingPaymentUsd > 0 && bcaPaymentUsd > remainingPaymentUsd) {
            form.setError('bcaPayment', { type: 'manual', message: 'Nominal USD tidak boleh melebihi sisa tagihan USD' });
            toast.error('Nominal USD tidak boleh melebihi sisa tagihan USD.');
            return;
        }

        if (remainingPayment > 0 && totalIdr > remainingPayment) {
            form.setError('cashPayment', { type: 'manual', message: 'Total pembayaran IDR tidak boleh melebihi sisa tagihan' });
            form.setError('bcaPayment2', { type: 'manual', message: 'Total pembayaran IDR tidak boleh melebihi sisa tagihan' });
            toast.error('Total pembayaran IDR tidak boleh melebihi sisa tagihan.');
            return;
        }
        await onSubmitPayment(values);
        resetForm();
    };

    const getPaymentMethods = (item: UnitBillingHistory): string[] => {
        if (Array.isArray(item.payment_methods) && item.payment_methods.length > 0) {
            return item.payment_methods;
        }

        const methods: string[] = [];
        if (getHistoryBcaIdrAmount(item) > 0) methods.push('BCA IDR');
        if (getHistoryUsdAmount(item) > 0) methods.push('BCA USD');
        if (getHistoryCashIdrAmount(item) > 0) methods.push('Cash');
        return methods;
    };

    const columns = useMemo<ColumnDef<UnitBillingHistory>[]>(
        () => [
            {
                header: 'Tanggal',
                accessorKey: 'payment_at',
                sortable: true,
                cell: (item) => item.payment_at ? formatDate(item.payment_at) : '-',
            },
            {
                header: 'BCA USD',
                cell: (item) => currenciesFormat('usd', getHistoryUsdAmount(item)),
            },
            {
                header: 'BCA IDR',
                cell: (item) => currenciesFormat('idr', getHistoryBcaIdrAmount(item)),
            },
            {
                header: 'Cash',
                cell: (item) => currenciesFormat('idr', getHistoryCashIdrAmount(item)),
            },
            {
                header: 'Metode',
                cell: (item) => {
                    const methods = getPaymentMethods(item);
                    return methods.length > 0 ? methods.join(', ') : '-';
                },
            },
            {
                header: 'Total',
                alignment: 'right',
                cell: (item) => {
                    const total = getHistoryTotalIdrEquivalent(item);
                    const usdAmount = getHistoryUsdAmount(item);
                    const idrAmount = getHistoryBcaIdrAmount(item) + getHistoryCashIdrAmount(item);
                    const isPureUsd = usdAmount > 0 && idrAmount === 0 && total === usdAmount;
                    return (
                        <span className="font-medium">
                            {currenciesFormat(isPureUsd ? 'usd' : 'idr', total)}
                        </span>
                    );
                },
            },
            {
                header: 'Keterangan',
                cell: (item) => <TextTruncate text={item.note || '-'} maxLength={10} />,
            },
            ...(onDeleteHistory
                ? [
                    {
                        header: 'Aksi',
                        alignment: 'center' as const,
                        sticky: 'right' as const,
                        cell: (item: UnitBillingHistory) => (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(item.id)}
                                disabled={loading || !!billing?.is_paid}
                                type="button"
                            >
                                <Trash className="w-4 h-4 text-red-500" />
                            </Button>
                        ),
                    },
                ]
                : []),
        ],
        [loading, onDeleteHistory, billing],
    );

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                {/* ── Section: Biaya ── */}
                <CollapsibleBox title="Biaya" description="Informasi ringkasan biaya transaksi" defaultExpanded={true}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{isPurchase ? 'Total Beli' : 'Total Jual'}</p>
                            <Input value={currenciesFormat('idr', displayDpp)} disabled />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Total PPN</p>
                            <Input value={currenciesFormat('idr', totalPpn)} disabled />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Total Biaya</p>
                            <Input value={currenciesFormat('idr', totalTagihan)} disabled />
                        </div>
                    </div>
                </CollapsibleBox>

                {/* ── Section: Invoice ── */}
                <CollapsibleBox title="Biaya Invoice" description="Rincian status pembayaran dan sisa tagihan" defaultExpanded={true}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Tanggal */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Tanggal</p>
                            <InputDate
                                value={form.watch('paymentDate')}
                                disabled
                            />
                        </div>
                        {/* Total Bayar */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Total Bayar</p>
                            <Input value={currenciesFormat('idr', projectedTotalPaid)} disabled />
                        </div>
                        {/* Kurang Bayar */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Kurang Bayar</p>
                            <Input value={currenciesFormat('idr', projectedRemaining)} disabled />
                        </div>
                        <div className="col-span-1 grid w-full grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2 md:col-span-3">
                            {/* Total Bayar USD */}
                            <div className="space-y-2 w-full">
                                <p className="text-sm font-medium">Total Bayar (USD)</p>
                                <Input value={currenciesFormat('usd', projectedTotalPaidUsd)} disabled className="w-full" />
                            </div>
                            {/* Kurang Bayar USD */}
                            <div className="space-y-2 w-full">
                                <p className="text-sm font-medium">Kurang Bayar (USD)</p>
                                <Input value={currenciesFormat('usd', projectedRemainingUsd)} disabled className="w-full" />
                            </div>
                        </div>
                    </div>
                </CollapsibleBox>

                {/* Validation warning */}
                {validationMessage && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        {validationMessage}
                    </div>
                )}

                {/* ── Section: Pembayaran ── */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <CollapsibleBox title="Form Pembayaran" description="Masukkan nominal pembayaran yang akan dilakukan" defaultExpanded={true}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2 md:col-span-3">
                                        <p className="text-sm font-medium">Tanggal Bayar</p>
                                        <InputDate
                                            value={form.watch('paymentDate')}
                                            disabled={billing && billingRemaining === 0 || isPaidAndValid}
                                            onChange={(e) => form.setValue('paymentDate', e.target.value)}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="bcaPayment"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-medium">BCA USD</FormLabel>
                                                <FormControl>
                                                    <MoneyInput
                                                        name={field.name}
                                                        currency="USD"
                                                        value={Number(field.value) || 0}
                                                        disabled={billing && billingRemaining === 0 || isPaidAndValid}
                                                        onChangeValue={(val) => {
                                                            const maxBca = remainingPaymentUsd;
                                                            const capped = parseAndClampMoneyInput(val, maxBca, 'USD');
                                                            field.onChange(capped);
                                                        }}
                                                        onBlur={field.onBlur}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="bcaPayment2"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-medium">BCA IDR</FormLabel>
                                                <FormControl>
                                                    <MoneyInput
                                                        name={field.name}
                                                        value={Number(field.value) || 0}
                                                        disabled={billing && billingRemaining === 0 || isPaidAndValid}
                                                        onChangeValue={(val) => {
                                                            const capped = parseAndClampMoneyInput(val, maxBca2);
                                                            field.onChange(capped);
                                                        }}
                                                        onBlur={field.onBlur}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cashPayment"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel className="text-sm font-medium">CASH IDR</FormLabel>
                                                <FormControl>
                                                    <MoneyInput
                                                        name={field.name}
                                                        value={Number(field.value) || 0}
                                                        disabled={billing && billingRemaining === 0 || isPaidAndValid}
                                                        onChangeValue={(val) => {
                                                            const capped = parseAndClampMoneyInput(val, maxCash);
                                                            field.onChange(capped);
                                                        }}
                                                        onBlur={field.onBlur}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Note */}
                                <div className="space-y-2 border-t pt-4">
                                    <FormLabel className="text-sm font-medium">Catatan</FormLabel>
                                    <FormField
                                        control={form.control}
                                        name="note"
                                        render={({ field }) => (
                                            <FormItem className="flex-1 space-y-2">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Catatan pembayaran (opsional)"
                                                        {...field}
                                                        disabled={billing && billingRemaining === 0 || isPaidAndValid}
                                                        value={field.value ?? ''}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </CollapsibleBox>

                        {/* Footer Buttons */}
                        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !canSubmit || billing && billingRemaining === 0 || isPaidAndValid}
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                            >
                                {loading ? (
                                    'Menyimpan...'
                                ) : (
                                    <>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Bayar
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>

                {/* ── Section: Histori Pembayaran ── */}
                <CollapsibleBox title="Riwayat Pembayaran" description="Daftar histori transaksi pembayaran" defaultExpanded={true}>
                    <BaseTable
                        data={histories ?? []}
                        columns={columns}
                        containerClassName="border-0 shadow-none rounded-none"
                        headerRowClassName="bg-slate-50 hover:bg-slate-50 border-b"
                    />
                </CollapsibleBox>
            </div>

            <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-md border-slate-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Histori Pembayaran</AlertDialogTitle>
                        <AlertDialogDescription>
                            Data histori pembayaran ini akan dihapus secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteId && onDeleteHistory) {
                                    onDeleteHistory(deleteId);
                                    setDeleteId(null);
                                }
                            }}
                            disabled={!!billing?.is_paid}
                            className="rounded-md bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
