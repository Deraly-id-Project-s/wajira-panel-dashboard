import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { formatDate } from '@/lib/utils/format';
import type { WithholdingTaxItem } from '@/@types/withholding-tax.types';
import { Calendar, CreditCard, FileText, Receipt, User } from 'lucide-react';
import { useRouter } from 'next/router';

interface Props {
  data: WithholdingTaxItem;
}

const formatSource = (source: string) => {
  if (source === 'external') return 'Client / Supplier';
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : '-';
};

export function BuktiPotongDetailCards({ data }: Props) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const kasCurrency = (data.cash as any)?.currency_type
    ? String((data.cash as any).currency_type).toUpperCase()
    : 'IDR';

  const invoiceTotal =
    data.do_invoice?.total_amount ??
    data.do_invoice?.invoice_amount ??
    data.do_invoice?.bill_invoice ??
    0;

  const invoiceCode = data.no_invoice || data.do_invoice?.code || '-';
  const invoiceLink = data.do_invoice?.id
    ? `/dashboard/${slug}/administrasi/do-invoice/detail/${data.do_invoice.id}`
    : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card 1: Informasi Bukti Potong */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-blue-50 p-2">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              Informasi Bukti Potong
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Nomor Bukti Potong</p>
              <div className="text-sm font-semibold text-slate-900">
                <CopyBox text={data.withholding_number || '-'} />
              </div>
            </div>
            <div className="space-y-1">
              <p>Sumber (Source)</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {formatSource(data.source)}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p>Masa Bukti Potong</p>
              <p className="text-sm font-semibold text-slate-900">
                {data.withholding_age ? `${data.withholding_age} Bulan` : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p>Tanggal Bayar</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-slate-500" />
                {data.payment_date ? formatDate(data.payment_date) : '-'}
              </div>
            </div>
            {data.company?.name && (
              <div className="space-y-1">
                <p>Perusahaan</p>
                <p className="text-sm font-semibold text-slate-900">
                  {data.company.name}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Informasi Keuangan */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              Informasi Keuangan
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Kas Terkait</p>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {data.cash
                    ? `${data.cash.code} - ${data.cash.cash_name || data.cash.description || ''}`
                    : '-'}
                </span>
                <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
                  {kasCurrency}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Nominal PPH</span>
              <span className="text-sm font-semibold text-slate-900">
                {currenciesFormat('idr', data.pph_amount || 0)}
              </span>
            </div>
            <div className="space-y-1">
              <p>Uang Muka PPH / Keterangan</p>
              <p className="break-words text-sm font-medium text-slate-700">
                {data.pph_description || '-'}
              </p>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <div className="flex items-center justify-between text-slate-900">
              <span className="text-sm font-bold uppercase">
                JUMLAH PEMBAYARAN
              </span>
              <span className="text-base font-bold text-emerald-600">
                {currenciesFormat('idr', data.payment_amount || 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Referensi Invoice */}
      <Card className="h-full rounded-md border border-slate-200 shadow-sm">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-purple-50 p-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              Referensi Invoice
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="space-y-1">
              <p>Nomor Invoice</p>
              <div className="text-sm font-semibold text-slate-900">
                <CopyBox text={invoiceCode} href={invoiceLink} />
              </div>
            </div>
            <div className="space-y-1">
              <p>Tanggal Invoice</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="h-4 w-4 text-slate-500" />
                {data.do_invoice?.date ? formatDate(data.do_invoice.date) : '-'}
              </div>
            </div>
            <div className="space-y-1">
              <p>Customer Terkait</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate uppercase">
                  {data.do_invoice?.customer?.name ? (
                    <ReferenceLink
                      href={`/dashboard/${slug}/master/customer?search=${encodeURIComponent(
                        data.do_invoice.customer.name
                      )}`}
                    >
                      {data.do_invoice.customer.name}
                    </ReferenceLink>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <div className="flex items-center justify-between text-slate-900">
              <span className="text-sm font-bold uppercase">TOTAL TAGIHAN</span>
              <span className="text-sm font-bold text-slate-900">
                {currenciesFormat('idr', invoiceTotal)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
