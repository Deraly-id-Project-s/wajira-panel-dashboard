import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import type { LiabilityPaymentHistory } from '@/types/pembayaran-hutang.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
    data: LiabilityPaymentHistory[]
}

const formatDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID');
};

export default function PembayaranHutangListTable({ data }: Props) {
    const rows = [...data].sort((left, right) => {
        const leftDate = new Date(left.payment_at || left.created_at).getTime();
        const rightDate = new Date(right.payment_at || right.created_at).getTime();
        return rightDate - leftDate;
    });

    const total = rows.reduce((acc, item) => acc + item.cash_payment_amount + item.bca_payment_amount + item.bca_payment_usd_amount, 0)

    const columns: ColumnDef<LiabilityPaymentHistory>[] = [
        {
            header: 'No',
            alignment: 'left',
            cell: (_, index) => <span className="text-gray-600">{index + 1}</span>,
        },
        {
            header: 'Tanggal Bayar',
            alignment: 'left',
            cell: (item) => <span className="text-gray-700">{formatDate(item.payment_at || item.created_at)}</span>,
        },
        {
            header: 'Cash Payment',
            alignment: 'right',
            cell: (item) => <span className="font-medium text-gray-900">{formatCurrency(item.cash_payment_amount)}</span>,
        },
        {
            header: 'BCA Payment',
            alignment: 'right',
            cell: (item) => (
                <div className="space-y-1">
                    <div className="font-medium text-gray-900">{formatCurrency(item.bca_payment_amount)}</div>
                    {item.bca_payment_usd_amount > 0 ? <div className="text-xs text-gray-500">{formatCurrency(item.bca_payment_usd_amount, 'USD')}</div> : null}
                </div>
            ),
        },
        {
            header: 'Total',
            alignment: 'right',
            cell: (item) => {
                const totalPayment = item.cash_payment_amount + item.bca_payment_amount + item.bca_payment_usd_amount;
                return <span className="font-semibold text-emerald-600">{formatCurrency(totalPayment)}</span>;
            },
        },
        {
            header: 'Keterangan',
            alignment: 'left',
            cell: (item) => <span className="text-gray-600">{item.note || '-'}</span>,
        },
        {
            header: 'Bukti Bayar',
            alignment: 'left',
            cell: (item) => {
                const proofUrl = item.payment_proof;
                return proofUrl ? (
                    <Button variant="outline" asChild>
                        <a href={proofUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Lihat Bukti
                        </a>
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
    ];

    const footer = (
        <tfoot className="border-t bg-gray-50/80">
            <tr className="font-semibold text-gray-900">
                <td colSpan={4} className="px-4 py-4 text-right">
                    Sub Total
                </td>
                <td className="px-4 py-4 text-right">{formatCurrency(total)}</td>
                <td colSpan={2}></td>
            </tr>
        </tfoot>
    );

    return (
        <div className="space-y-4">
            <BaseTable
                data={rows}
                columns={columns}
                footer={footer}
                headerRowClassName="bg-gray-100/80 text-gray-600"
            />
        </div>
    )
}
