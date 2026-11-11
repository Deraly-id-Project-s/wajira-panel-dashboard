import React, { useMemo } from 'react';
import {
  MoreVertical,
  Plus,
  CreditCard,
} from 'lucide-react';
import type {
  GeneralJournal,
  GeneralJournalBillingPayment,
} from '@/@types/general-journal.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { TextTruncate } from '@/components/ui/text-truncate';
import { cn } from '@/lib/utils';

interface Props {
  journal: GeneralJournal;
  payments: GeneralJournalBillingPayment[];
  isPaid: boolean;
  canEdit: boolean;
  isUsd: boolean;
  totalDebit?: number;
  totalCredit?: number;
  paidDebit?: number;
  paidCredit?: number;
  remainingDebit?: number;
  remainingCredit?: number;
  isDebitSettled?: boolean;
  isCreditSettled?: boolean;
  onAddPayment: (defaultType?: 'debit' | 'credit') => void;
  onEditPayment: (payment: GeneralJournalBillingPayment) => void;
  onDeletePayment: (payment: GeneralJournalBillingPayment) => void;
}

export default function GeneralJournalEntriesTable({
  journal,
  payments,
  isPaid,
  canEdit,
  isUsd,
  paidDebit = 0,
  paidCredit = 0,
  isDebitSettled = false,
  isCreditSettled = false,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}: Props) {
  const currency = isUsd ? 'usd' : 'idr';
  const isBalanced = Boolean(journal.is_balanced);

  // Definisi kolom tabel pembayaran jurnal umum
  const columns = useMemo<ColumnDef<GeneralJournalBillingPayment>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'center',
        cell: (_, index) => (
          <span className="text-slate-400 font-mono text-xs w-[40px] inline-block text-center">
            {(index ?? 0) + 1}
          </span>
        ),
      },
      {
        header: 'KODE AKUN',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <CopyBox text={item.account?.code || '-'} />
          </div>
        ),
      },
      {
        header: 'NAMA AKUN (COA)',
        alignment: 'left',
        cell: (item) => (
          <div>
            <p className="font-semibold text-slate-900 text-sm">{item.account?.name || '-'}</p>
            {item.account?.type ? (
              <span className="text-[11px] text-slate-400 capitalize">
                Tipe: {item.account.type}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'KETERANGAN',
        alignment: 'left',
        cell: (item) => (
          <TextTruncate
            text={item.note || '-'}
            maxLength={40}
            className="text-xs text-slate-600"
          />
        ),
      },
      {
        header: 'POSISI',
        alignment: 'center',
        cell: (item) => {
          const isDebit = item.type === 'debit';
          return (
            <Badge
              variant="outline"
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                isDebit
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              )}
            >
              {isDebit ? 'Debet' : 'Kredit'}
            </Badge>
          );
        },
      },
      {
        header: 'DEBET',
        alignment: 'right',
        cell: (item) => {
          const isDebit = item.type === 'debit';
          return (
            <span className="tabular-nums font-semibold text-emerald-700">
              {isDebit ? currenciesFormat(currency, item.amount) : '-'}
            </span>
          );
        },
      },
      {
        header: 'KREDIT',
        alignment: 'right',
        cell: (item) => {
          const isCredit = item.type === 'credit';
          return (
            <span className="tabular-nums font-semibold text-rose-700">
              {isCredit ? currenciesFormat(currency, item.amount) : '-'}
            </span>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          const isDebit = item.type === 'debit';
          // Aturan kunci mutasi per dokumentasi:
          // Debit terkunci jika isPaid = true.
          // Kredit terkunci jika isPaid = true dan isBalanced = true.
          const isLocked = isDebit ? isPaid : (isPaid && isBalanced);
          const canModify = !isLocked && canEdit;

          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg"
                >
                  <DropdownMenuItem
                    disabled={!canModify}
                    onClick={() => onEditPayment(item)}
                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canModify}
                    onClick={() => onDeletePayment(item)}
                    className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canEdit, currency, isBalanced, isPaid, onDeletePayment, onEditPayment],
  );

  // Footer: Total Pembayaran
  const paymentFooter = (
    <TableRow className="border-t-2 border-slate-300 bg-slate-50/90 font-bold hover:bg-slate-50/90">
      <TableCell
        colSpan={5}
        className="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-700 font-bold"
      >
        Total Pembayaran
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-emerald-800">
        {currenciesFormat(currency, paidDebit)}
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-rose-800">
        {currenciesFormat(currency, paidCredit)}
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        {isBalanced && paidDebit > 0 && paidCredit > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            Seimbang
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Belum Seimbang
          </span>
        )}
      </TableCell>
    </TableRow>
  );

  const canAddMorePayments = canEdit && !(isPaid && isBalanced);

  return (
    <Card className="rounded-md border-slate-200 shadow-xs">
      <CardHeader className="border-b border-slate-100 py-4 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-700" />
              <CardTitle className="text-base font-semibold text-slate-950">
                Pembayaran Jurnal Umum
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Daftar alokasi pembayaran debet dan kredit jurnal umum
            </CardDescription>
          </div>

          {/* Action buttons: Tambah Pembayaran Debet / Kredit */}
          <div className="flex flex-wrap items-center gap-2">
            {canAddMorePayments ? (
              <>
                {!isDebitSettled && !isPaid ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onAddPayment('debit')}
                    className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Bayar Debet
                  </Button>
                ) : null}

                {!isCreditSettled ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onAddPayment('credit')}
                    className="h-8 gap-1.5 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 bg-white shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Bayar Kredit
                  </Button>
                ) : null}

                <Button
                  type="button"
                  size="sm"
                  onClick={() => onAddPayment(isDebitSettled ? 'credit' : 'debit')}
                  className="btn-primary h-8 gap-1.5 text-xs shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Pembayaran
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <BaseTable
          data={payments}
          columns={columns}
          footer={payments.length > 0 ? paymentFooter : undefined}
          loading={false}
          emptyText="Belum ada data pembayaran. Silakan klik Tambah Pembayaran untuk mencatat pembayaran."
        />
      </CardContent>
    </Card>
  );
}
