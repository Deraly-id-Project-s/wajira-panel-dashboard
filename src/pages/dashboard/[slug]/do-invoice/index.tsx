import * as React from 'react';
import { useRouter } from 'next/router';
import { FileText } from 'lucide-react';
import { DoInvoiceTable } from '@/components/features/do-invoice/DoInvoiceTable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDoInvoices } from '@/hooks/useDoInvoice';
import { PageHeader } from '@/components/ui/page-header';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DoInvoiceListPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const [searchInput, setSearchInput] = React.useState('');
  const search = useDebouncedValue(searchInput.trim(), 350);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(25);
  const [paidFilter, setPaidFilter] = React.useState<'all' | 'paid' | 'unpaid'>('all');

  React.useEffect(() => setPage(1), [search, paidFilter]);

  const listQuery = useDoInvoices({
    page,
    perPage,
    search,
    order_by: 'created_at',
    order_sort: 'desc',
    company_id: companyId ?? undefined,
    is_paid: paidFilter === 'all' ? undefined : paidFilter === 'paid',
    enabled: Boolean(companyId),
  });
  const data = listQuery.data?.data ?? [];
  const detailHref = React.useCallback((invoice: { id: number; uuid?: string }) =>
    `/dashboard/${slug}/administrasi/do-invoice/detail/${encodeURIComponent(String(invoice.uuid || invoice.id))}`, [slug]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="DO Invoice" subtitle="Kelola invoice, billing, pembayaran, dan dokumen cetak hasil order list." />
        <SearchPagination
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Cari kode invoice, order, atau customer..."
          searchAriaLabel="Cari DO invoice"
          page={page}
          perPage={perPage}
          total={listQuery.data?.meta.total}
          lastPage={listQuery.data?.meta.lastPage}
          onPageChange={setPage}
          onPerPageChange={(value) => { setPerPage(value); setPage(1); }}
          filters={
            <Select value={paidFilter} onValueChange={(value) => setPaidFilter(value as typeof paidFilter)}>
              <SelectTrigger className="w-full bg-white sm:w-[170px]" aria-label="Filter status pembayaran"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="unpaid">Belum Lunas</SelectItem><SelectItem value="paid">Lunas</SelectItem></SelectContent>
            </Select>
          }
          actions={listQuery.isFetching ? <span className="text-xs text-slate-400">Memperbarui data...</span> : undefined}
        >
          {listQuery.isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700"><FileText className="mx-auto mb-2 h-6 w-6" />Gagal memuat DO invoice.</div>
          ) : (
            <DoInvoiceTable data={data} isLoading={!listQuery.data} detailHref={detailHref} onDetail={(invoice) => void router.push(detailHref(invoice))} />
          )}
        </SearchPagination>
      </div>
    </DashboardLayout>
  );
}
