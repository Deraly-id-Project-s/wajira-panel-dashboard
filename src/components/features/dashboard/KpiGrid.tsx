import { AccountOverview } from '@/types/dashboard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/utils/format';
import { Banknote, CreditCard } from 'lucide-react';

interface KpiGridProps {
  accounts: AccountOverview[];
  isLoading?: boolean;
}

type PaletteKey = 'cash' | 'USD' | 'IDR';

const palette: Record<PaletteKey, { bg: string; text: string }> = {
  cash: { bg: 'bg-green-100', text: 'text-green-700' },
  USD: { bg: 'bg-blue-100', text: 'text-blue-700' },
  IDR: { bg: 'bg-red-100', text: 'text-red-700' },
};

function InfoRow({ label, value, colorClass = 'text-gray-900', currency }: { label: string; value: number; colorClass?: string; currency: AccountOverview['currency'] }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right ${colorClass} whitespace-nowrap`}>{formatMoney(value, currency)}</span>
    </div>
  );
}

function AccountCard({ account }: { account: AccountOverview }) {
  const Icon = account.type === 'cash' ? Banknote : CreditCard;
  const paletteKey: PaletteKey = account.type === 'cash' ? 'cash' : account.currency;
  const color = palette[paletteKey];

  return (
    <Card className="flex h-full flex-col space-y-6 rounded-md border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${color.bg}`}>
          <Icon className={`h-5 w-5 ${color.text}`} />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">{account.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">{account.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col space-y-3">
        <InfoRow label="Saldo Awal" value={account.openingBalance} currency={account.currency} />
        <InfoRow label="Debet" value={account.debit} currency={account.currency} colorClass="text-green-600" />
        <InfoRow label="Kredit" value={account.credit} currency={account.currency} colorClass="text-red-600" />
      </div>

      <div className="mt-auto flex items-center justify-between rounded-md bg-red-400 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-white">Saldo Akhir</span>
        <span className="text-sm font-semibold text-white">{formatMoney(account.closingBalance, account.currency)}</span>
      </div>
    </Card>
  );
}

function SkeletonCard() {
  return <Skeleton className="h-[210px] rounded-md" />;
}

export function KpiGrid({ accounts, isLoading }: KpiGridProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </section>
    );
  }

  if (!accounts?.length) return null;

  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}
    </section>
  );
}
