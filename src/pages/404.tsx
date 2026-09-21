// DashboardLayout removed - not used here
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    // <DashboardLayout>
    // </DashboardLayout>
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-5 py-10 text-center">
      <p className="mb-4 text-5xl font-bold uppercase tracking-widest text-primary">404</p>

      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">Halaman Tidak Ditemukan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground sm:text-base">Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.</p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Kembali
        </Button>
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Ke Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
