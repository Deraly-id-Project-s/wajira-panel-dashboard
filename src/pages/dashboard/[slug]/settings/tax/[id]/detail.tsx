import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getTaxDetail } from '@/services/tax.service';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TaxDetailPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const taxId = Number(router.query.id);

  const { data, isLoading } = useQuery({
    queryKey: ['tax', taxId],
    queryFn: () => getTaxDetail(taxId),
    enabled: !!taxId,
  });

  const tax = data?.data;

  return (
    <>
      <Head>
        <title>Detail Pajak | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/${slug}/settings/tax`)}
                className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Detail Pajak</h1>
                <p className="text-sm text-muted-foreground">Lihat detail informasi pajak dan riwayat versinya</p>
              </div>
            </div>
          </div>

          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="text-base font-semibold">Informasi Pajak</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading || !tax ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Kode Pajak</p>
                    <p className="text-base font-semibold text-slate-900">{tax.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Nama Pajak</p>
                    <p className="text-base text-slate-900">{tax.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Status Kunci</p>
                    {tax.is_lock === 1 || tax.is_lock === true ? (
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        Terkunci
                      </Badge>
                    ) : (
                      <span className="text-base text-slate-900">-</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b px-6 py-4 bg-white">
              <CardTitle className="text-base font-semibold">Riwayat Versi Pajak</CardTitle>
            </CardHeader>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">NAMA VERSI</th>
                    <th className="px-6 py-4 font-semibold">NILAI/RATE</th>
                    <th className="px-6 py-4 font-semibold">BERLAKU DARI</th>
                    <th className="px-6 py-4 font-semibold">BERLAKU SAMPAI</th>
                    <th className="px-6 py-4 font-semibold text-center">DEFAULT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Memuat data versi pajak...
                      </td>
                    </tr>
                  ) : tax?.tax_versions && tax.tax_versions.length > 0 ? (
                    tax.tax_versions.map((version) => (
                      <tr key={version.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{version.name}</td>
                        <td className="px-6 py-4 text-slate-700">{version.rate}%</td>
                        <td className="px-6 py-4 text-slate-700">{version.effective_from || '-'}</td>
                        <td className="px-6 py-4 text-slate-700">{version.effective_until || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          {version.is_default === 1 || version.is_default === true ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Default
                            </Badge>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Belum ada versi pajak yang terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
