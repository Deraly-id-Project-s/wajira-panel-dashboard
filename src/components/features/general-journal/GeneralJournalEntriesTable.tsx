import React, { useMemo, useState } from 'react';
import {
  MoreVertical,
  Plus,
  Wallet,
  CreditCard,
  Scale,
  ListOrdered,
  BookOpen,
} from 'lucide-react';
import type {
  GeneralJournal,
  GeneralJournalBillingCash,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TextTruncate } from '@/components/ui/text-truncate';
import { cn } from '@/lib/utils';

export interface UnifiedJournalEntry {
  id: string;
  originType: 'cash' | 'payment';
  code: string;
  name: string;
  categoryType?: string;
  note?: string | null;
  position: 'debit' | 'credit';
  debitAmount: number;
  creditAmount: number;
  rawCash?: GeneralJournalBillingCash;
  rawPayment?: GeneralJournalBillingPayment;
}

interface Props {
  journal: GeneralJournal;
  cashes: GeneralJournalBillingCash[];
  payments: GeneralJournalBillingPayment[];
  isPaid: boolean;
  canEdit: boolean;
  isUsd: boolean;
  totalDebit: number;
  totalCredit: number;
  remainingAmount: number;
  onAddPayment: () => void;
  onEditPayment: (payment: GeneralJournalBillingPayment) => void;
  onDeletePayment: (payment: GeneralJournalBillingPayment) => void;
}

export default function GeneralJournalEntriesTable({
  journal,
  cashes,
  payments,
  isPaid,
  canEdit,
  isUsd,
  totalDebit,
  totalCredit,
  remainingAmount,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'cashes' | 'payments'>('all');
  const currency = isUsd ? 'usd' : 'idr';
  const isBalanced = Boolean(journal.is_balanced);

  // 1. Unified double-entry memorial rows
  const unifiedEntries = useMemo<UnifiedJournalEntry[]>(() => {
    const rows: UnifiedJournalEntry[] = [];

    // Add debit cashes
    cashes.forEach((c, idx) => {
      rows.push({
        id: `cash-${c.id ?? idx}`,
        originType: 'cash',
        code: c.cash?.code || '-',
        name: c.cash?.cash_name || c.cash?.name || 'Kas / Bank',
        categoryType: c.cash?.type === 'bank' ? 'Bank' : 'Kas',
        note: journal.note || 'Sumber Kas Jurnal',
        position: 'debit',
        debitAmount: Number(c.amount || 0),
        creditAmount: 0,
        rawCash: c,
      });
    });

    // Add credit payments
    payments.forEach((p, idx) => {
      rows.push({
        id: `payment-${p.id ?? idx}`,
        originType: 'payment',
        code: p.account?.code || '-',
        name: p.account?.name || 'Akun Lawan (COA)',
        categoryType: p.account?.type || 'COA',
        note: p.note || '-',
        position: 'credit',
        debitAmount: 0,
        creditAmount: Number(p.amount || 0),
        rawPayment: p,
      });
    });

    return rows;
  }, [cashes, payments, journal.note]);

  // Unified Memorial Columns
  const unifiedColumns = useMemo<ColumnDef<UnifiedJournalEntry>[]>(
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
        header: 'KODE AKUN / KAS',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <CopyBox text={item.code} />
          </div>
        ),
      },
      {
        header: 'NAMA AKUN / KAS',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
            {item.categoryType ? (
              <span className="uppercase text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {item.categoryType}
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
          const isDebit = item.position === 'debit';
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
        cell: (item) => (
          <span className="tabular-nums font-semibold text-emerald-700">
            {item.debitAmount > 0 ? currenciesFormat(currency, item.debitAmount) : '-'}
          </span>
        ),
      },
      {
        header: 'KREDIT',
        alignment: 'right',
        cell: (item) => (
          <span className="tabular-nums font-semibold text-rose-700">
            {item.creditAmount > 0 ? currenciesFormat(currency, item.creditAmount) : '-'}
          </span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          if (item.originType !== 'payment' || !item.rawPayment) {
            return <span className="text-slate-300 text-xs">-</span>;
          }

          const paymentItem = item.rawPayment;
          const canModify = !isPaid && canEdit;

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
                    onClick={() => onEditPayment(paymentItem)}
                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!canModify}
                    onClick={() => onDeletePayment(paymentItem)}
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
    [canEdit, currency, isPaid, onDeletePayment, onEditPayment],
  );

  // Footer for Unified Table
  const unifiedFooter = (
    <TableRow className="border-t-2 border-slate-300 bg-slate-50/90 font-bold hover:bg-slate-50/90">
      <TableCell
        colSpan={5}
        className="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-700 font-bold"
      >
        Total Ayat Jurnal
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-emerald-800">
        {currenciesFormat(currency, totalDebit)}
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-rose-800">
        {currenciesFormat(currency, totalCredit)}
      </TableCell>
      <TableCell className="py-3 px-4 text-center">
        {isBalanced && totalDebit > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            Seimbang
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Selisih
          </span>
        )}
      </TableCell>
    </TableRow>
  );

  // Columns for Kas Table (Tab 2)
  const cashColumns = useMemo<ColumnDef<GeneralJournalBillingCash>[]>(
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
        header: 'KODE KAS',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <CopyBox text={item.cash?.code || '-'} />
          </div>
        ),
      },
      {
        header: 'NAMA KAS / BANK',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">
              {item.cash?.cash_name || item.cash?.name || '-'}
            </span>
            {item.cash?.currency_type ? (
              <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {item.cash.currency_type}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'TIPE',
        alignment: 'left',
        cell: (item) => (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs capitalize font-medium',
              item.cash?.type === 'bank'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            )}
          >
            {item.cash?.type || 'Kas'}
          </span>
        ),
      },
      {
        header: 'NOMINAL KAS (DEBET)',
        alignment: 'right',
        cell: (item) => (
          <span className="text-emerald-700 font-semibold tabular-nums">
            {currenciesFormat(currency, item.amount)}
          </span>
        ),
      },
    ],
    [currency],
  );

  const cashFooter = (
    <TableRow className="border-t-2 border-slate-300 bg-slate-50/90 font-bold hover:bg-slate-50/90">
      <TableCell
        colSpan={4}
        className="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-700 font-bold"
      >
        Total Debet Kas
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-emerald-800">
        {currenciesFormat(currency, totalDebit)}
      </TableCell>
    </TableRow>
  );

  // Columns for Payments Table (Tab 3)
  const paymentColumns = useMemo<ColumnDef<GeneralJournalBillingPayment>[]>(
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
        header: 'NOMINAL (KREDIT)',
        alignment: 'right',
        cell: (item) => (
          <span className="text-rose-700 font-semibold tabular-nums">
            {currenciesFormat(currency, item.amount)}
          </span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          const canModify = !isPaid && canEdit;

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
    [canEdit, currency, isPaid, onDeletePayment, onEditPayment],
  );

  const paymentFooter = (
    <TableRow className="border-t-2 border-slate-300 bg-slate-50/90 font-bold hover:bg-slate-50/90">
      <TableCell
        colSpan={4}
        className="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-700 font-bold"
      >
        Total Kredit Pembayaran
      </TableCell>
      <TableCell className="py-3 px-4 text-right tabular-nums text-sm font-bold text-rose-800">
        {currenciesFormat(currency, totalCredit)}
      </TableCell>
      <TableCell className="py-3 px-4" />
    </TableRow>
  );

  return (
    <Card className="rounded-md border-slate-200 shadow-xs">
      <CardHeader className="border-b border-slate-100 py-4 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-700" />
              <CardTitle className="text-base font-semibold text-slate-950">
                Rincian Ayat Jurnal Umum
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Struktur pembukuan debet kas dan alokasi kredit akun lawan (COA)
            </CardDescription>
          </div>

          {/* Action button: Tambah Akun Lawan */}
          <div className="flex items-center gap-2">
            {!isPaid && canEdit && remainingAmount > 0 ? (
              <Button
                type="button"
                size="sm"
                onClick={onAddPayment}
                className="btn-primary h-8 gap-1.5 text-xs shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Akun Lawan
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Tabs switcher */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
            <TabsList className="bg-slate-100/90 p-1">
              <TabsTrigger value="all" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                <Scale className="h-3.5 w-3.5 text-slate-500" />
                Semua Ayat Jurnal ({unifiedEntries.length})
              </TabsTrigger>
              <TabsTrigger value="cashes" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                Kas (Debet) ({cashes.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                <CreditCard className="h-3.5 w-3.5 text-rose-600" />
                Akun Lawan (Kredit) ({payments.length})
              </TabsTrigger>
            </TabsList>

            <span className="text-xs text-slate-500">
              {unifiedEntries.length} baris ayat jurnal terdaftar
            </span>
          </div>

          {/* Tab 1: Unified Memorial Journal Table */}
          <TabsContent value="all" className="mt-3">
            <BaseTable
              data={unifiedEntries}
              columns={unifiedColumns}
              footer={unifiedFooter}
              loading={false}
            />
          </TabsContent>

          {/* Tab 2: Kas Debet Table */}
          <TabsContent value="cashes" className="mt-3">
            <BaseTable
              data={cashes}
              columns={cashColumns}
              footer={cashFooter}
              loading={false}
            />
          </TabsContent>

          {/* Tab 3: Akun Lawan Kredit Table */}
          <TabsContent value="payments" className="mt-3">
            <BaseTable
              data={payments}
              columns={paymentColumns}
              footer={paymentFooter}
              loading={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
