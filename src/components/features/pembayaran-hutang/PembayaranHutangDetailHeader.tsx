import Link from 'next/link';
import { useRouter } from 'next/router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils/currency';
import { ArrowLeft, Building2, CalendarDays, CheckCircle2, ListChecks, ReceiptText } from 'lucide-react';
import type { LiabilityDetail } from '@/types/pembayaran-hutang.types';
import { CopyBox } from '@/components/ui/copy-box';

interface Props {
  data: LiabilityDetail;
  onAddPayment: () => void;
  addPaymentDisabled?: boolean;
  backHref?: string;
}

export default function PembayaranHutangDetailHeader({ data, onAddPayment, addPaymentDisabled, backHref }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const summary = data.billing_summary;
  const percentage = Math.max(0, Math.min(100, summary.paid_percentage));
  const defaultBackHref = slug ? `/dashboard/${slug}/finance/data-pembayaran-hutang` : '/dashboard';
  const resolvedBackHref = backHref ?? defaultBackHref;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: resolvedBackHref.includes('data-hutang') && !resolvedBackHref.includes('pembayaran') ? 'Data Hutang' : 'Data Pembayaran Hutang', onClick: () => router.push(resolvedBackHref) },
          { label: 'Detail Hutang Pembelian' }
        ]}
        title="Detail Hutang Pembelian"
        subtitle={
          <>
            <span>Invoice <span className="font-medium text-gray-900">{data.code}</span> milik <span className="font-medium text-gray-900">{data.person.name}</span></span>
            <Badge variant={summary.is_paid ? 'default' : 'outline'} className={summary.is_paid ? 'bg-emerald-600 text-white' : 'text-gray-600'}>
              {summary.is_paid ? 'Lunas' : 'Belum Lunas'}
            </Badge>
          </>
        }
        onBack={() => router.push(resolvedBackHref)}
        actions={
          <Button onClick={onAddPayment} disabled={addPaymentDisabled} className="button-theme-1!">
            Tambah Pembayaran
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Hutang</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{formatCurrency(summary.grand_total)}</p>
        </div>
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Dibayar</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(summary.total_paid)}</p>
        </div>
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sisa Hutang</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(summary.remaining_payment)}</p>
        </div>
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Persentase</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{percentage.toFixed(0)}%</p>
          <div className="mt-3">
            <Progress value={percentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-sky-50 p-2 text-sky-600">
              <ReceiptText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Informasi Transaksi</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Nomor Transaksi</p>
              <CopyBox text={data.code} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Billing ID</p>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{data.unit_transaction_billing.id}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Supplier</p>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{data.person.name}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{summary.is_paid ? 'Lunas' : 'Belum lunas'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-violet-50 p-2 text-violet-600">
              <ListChecks className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Status Pembayaran</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Hutang</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.grand_total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total Dibayar</span>
              <span className="font-medium text-emerald-600">{formatCurrency(summary.total_paid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Sisa Hutang</span>
              <span className="font-medium text-rose-600">{formatCurrency(summary.remaining_payment)}</span>
            </div>

            <div className="pt-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">Progress Pembayaran</span>
                <span className="text-gray-500">{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
