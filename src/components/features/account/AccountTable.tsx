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

interface AccountTableProps {
  data: Account[];
  total: number;
  isLoading: boolean;
  page: number;
  perPage: number;
  selectedIds: Set<string>;
  canEdit: boolean;
  canDelete: boolean;
  onToggleAll: (checked: boolean) => void;
  onToggleRow: (id: string, checked: boolean) => void;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onPageChange: (page: number) => void;
}

export function AccountTable({
  data,
  total,
  isLoading,
  page,
  perPage,
  selectedIds,
  onToggleAll,
  onToggleRow,
  onEdit,
  onDelete,
  onPageChange,
  canEdit,
  canDelete,
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
        header: 'KATEGORI AKUN',
        accessorKey: 'category',
        sortable: true,
        cell: (account) => getAccountCategoryLabel(account.category),
      },
      {
        header: 'aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (account) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                disabled={account.is_lock || !canEdit}
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit(account);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                disabled={account.is_lock || !canDelete}
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete(account);
                }}
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
      meta={{
        currentPage: page,
        perPage: perPage,
        lastPage: Math.max(1, Math.ceil(total / perPage)),
        total: total,
      }}
      onPageChange={onPageChange}
    />
  );
}
