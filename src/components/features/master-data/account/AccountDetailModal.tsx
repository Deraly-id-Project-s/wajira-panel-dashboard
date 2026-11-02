import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccount } from '@/hooks/useAccount';
import { getAccountCategoryBadgeClass, getAccountCategoryLabel, getAccountClassBadgeClass, getAccountClassLabel, getAccountTypeLabel } from '@/lib/account';

interface AccountDetailModalProps {
  accountId: string | number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (id: string | number) => void;
  canEdit?: boolean;
}

export const AccountDetailModal = ({
  accountId,
  open,
  onOpenChange,
  onEdit,
  canEdit = false,
}: AccountDetailModalProps) => {
  const { data: account, isLoading, isError } = useAccount(open && accountId ? accountId : undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl border border-slate-200">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">Detail Akun</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Informasi lengkap master data akun
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError || !account ? (
            <div className="py-6 text-center text-sm text-red-600">
              Gagal memuat detail akun. Silakan coba kembali.
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-slate-50/80 p-3.5 border border-slate-100">
                <div className="text-xs font-medium text-slate-500">Kode & Nama Akun</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono font-bold text-slate-900 text-base">{account.code}</span>
                  <span className="font-medium text-slate-700">- {account.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-slate-500">Grup Akun</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {account.accountGroupCode ?? (account as any).accountGroup?.name ?? account.group ?? '-'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Tipe Akun</dt>
                  <dd className="mt-1">
                    {account.type ? (
                      <Badge
                        variant="outline"
                        className={
                          account.type === 'debet' || account.type === 'debit'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }
                      >
                        {getAccountTypeLabel(account.type)}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Klasifikasi Akun (Class)</dt>
                  <dd className="mt-1">
                    {account.class ? (
                      <Badge variant="outline" className={getAccountClassBadgeClass(account.class)}>
                        {getAccountClassLabel(account.class)}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Kategori Pos</dt>
                  <dd className="mt-1 font-mono font-medium text-slate-800">
                    {account.pos_code ?? account.posCode ?? '-'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Kategori Laporan</dt>
                  <dd className="mt-1">
                    {account.category ? (
                      <Badge variant="outline" className={getAccountCategoryBadgeClass(account.category)}>
                        {getAccountCategoryLabel(account.category)}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Status</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <Badge variant={account.isActive ? 'default' : 'secondary'} className={account.isActive ? '' : 'bg-gray-200 text-gray-700'}>
                      {account.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {account.is_lock && (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                        Terkunci (Default)
                      </Badge>
                    )}
                  </dd>
                </div>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Deskripsi</dt>
                <dd className="mt-1 text-slate-700 rounded-md bg-slate-50 p-2.5 min-h-[44px] whitespace-pre-wrap">
                  {account.description || <span className="text-slate-400 italic">Tidak ada deskripsi</span>}
                </dd>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {canEdit && account && onEdit && (
            <Button
              type="button"
              variant="default"
              onClick={() => {
                onOpenChange(false);
                onEdit(account.id);
              }}
            >
              Edit Akun
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
