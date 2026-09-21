import { useMemo } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { CopyBox } from '@/components/ui/copy-box';
import { ReferenceLink } from '@/components/ui/reference-link';
import { getAccountCategoryLabel } from '@/lib/account';
import type { Account } from '@/@types/account.types';
import { useRouter } from 'next/router';
import { MoreVertical, Lock } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';

interface AccountTableProps {
  data: Account[];
  isLoading: boolean;
  selectedIds: Set<string>;
  canEdit: boolean;
  canDelete: boolean;
  canManageLock: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (id: string, checked: boolean) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

export function AccountTable({
  data,
  isLoading,
  selectedIds,
  onToggleAll,
  onToggleRow,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  canManageLock,
}: AccountTableProps) {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';

  const handleSelectedIdsChange = (newSelected: Set<string>) => {
    const pageIds = data.map((item) => String(item.id));
    const allCheckedBefore = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    const allCheckedAfter = pageIds.length > 0 && pageIds.every((id) => newSelected.has(id));

    if (allCheckedBefore !== allCheckedAfter) {
      onToggleAll(allCheckedAfter);
    } else {
      // Find the single difference
      const added = pageIds.find((id) => newSelected.has(id) && !selectedIds.has(id));
      if (added) {
        onToggleRow(added, true);
        return;
      }
      const removed = pageIds.find((id) => !newSelected.has(id) && selectedIds.has(id));
      if (removed) {
        onToggleRow(removed, false);
      }
    }
  };

  const columns = useMemo<ColumnDef<Account>[]>(
    () => [
      {
        header: 'KODE AKUN',
        accessorKey: 'code',
        sortable: true,
        cell: (account) => (
          <div className="flex items-center gap-1.5">
            <CopyBox text={account.code} />
            {account.is_lock && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Akun ini merupakan data default yang tidak bisa dihapus!
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        header: 'NAMA AKUN',
        accessorKey: 'name',
        sortable: true,
      },
      {
        header: 'GRUP AKUN',
        accessorKey: 'accountGroupCode',
        sortable: true,
        alignment: 'center',
        cell: (account) => (
          <ReferenceLink href={`/dashboard/${slugStr}/master/account-group?search=${encodeURIComponent(account.accountGroupCode ?? account.accountGroupId ?? '')}`}>
            {account.accountGroupCode ?? '-'}
          </ReferenceLink>
        ),
      },
      {
        header: 'TIPE AKUN',
        accessorKey: 'type',
        sortable: true,
        alignment: 'center',
        cell: (account) => {
          if (!account.type) return <span className="text-gray-400">-</span>;
          const isDebet = account.type === 'debet' || account.type === 'debit';
          return (
            <Badge
              variant="outline"
              className={
                isDebet
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
              }
            >
              {isDebet ? 'Debet' : 'Kredit'}
            </Badge>
          );
        },
      },
      {
        header: 'KODE POS',
        accessorKey: 'pos_code',
        sortable: true,
        alignment: 'center',
        cell: (account) => (
          <span className="text-sm font-mono text-slate-600">
            {account.pos_code ?? account.posCode ?? '-'}
          </span>
        ),
      },
      {
        header: 'KATEGORI AKUN',
        accessorKey: 'category',
        sortable: true,
        cell: (account) => {
          if (!account.category) return <span className="text-gray-400">-</span>;

          let badgeClass = 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50';
          const label = getAccountCategoryLabel(account.category);

          switch (account.category) {
            case 'general':
              badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
              break;
            case 'operational':
              badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50';
              break;
            case 'director_receivable':
              badgeClass = 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50';
              break;
            case 'shareholder_receivable':
              badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50';
              break;
            case 'receivable':
              badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
              break;
            case 'inventory':
              badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50';
              break;
          }

          return (
            <Badge variant="outline" className={badgeClass}>
              {label}
            </Badge>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (account) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                disabled={!canEdit}
                onClick={() => onEdit(account)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                disabled={account.is_lock || !canDelete}
                onClick={() => onDelete(account)}
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canEdit, canDelete, onEdit, onDelete, slugStr]
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={isLoading}
      showCheckbox
      selectedIds={selectedIds}
      onSelectedIdsChange={handleSelectedIdsChange}
      getRowId={(item) => String(item.id)}
      isCheckboxDisabled={(item) => Boolean(item.is_lock && !canManageLock)}
    />
  );
}
