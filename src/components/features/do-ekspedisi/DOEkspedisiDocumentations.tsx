import React from 'react';
import { Camera } from 'lucide-react';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDoEkspedisiDocumentations } from '@/hooks/useDoEkspedisi';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { ImagePreview } from '@/components/ui/image-preview';
import type { DoEkspedisi, DoEkspedisiDocumentation } from '@/@types/do-ekspedisi.types';

interface DOEkspedisiDocumentationsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

function RelatedSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string | null;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-700">{icon}</div>
          <div>
            <h2 className="font-semibold text-slate-950">{title}</h2>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiDocumentations({ data }: DOEkspedisiDocumentationsProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const { data: responseData, isLoading } = useDoEkspedisiDocumentations({
    do_expedition_id: data.id,
    perPage: 100,
  });

  const documentations = responseData?.data ?? [];

  const columns: ColumnDef<DoEkspedisiDocumentation>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    {
      header: 'Posisi',
      cell: (x) => (
        <Badge variant="outline" className="capitalize">
          {x.documentationPosition === 'start' ? 'Dokumentasi Ekspedisi' : x.documentationPosition === 'end' ? 'Dokumentasi Penyerahan' : x.documentationPosition}
        </Badge>
      ),
    },
    { header: 'Subject', cell: (x) => x.subject },
    { header: 'Deskripsi', cell: (x) => x.description || '-' },
    {
      header: 'Gambar',
      cell: (x) => x.image ? (
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
          onClick={() => setPreviewUrl(getObjectStorageUrl(x.image))}
        >
          Lihat Gambar
        </Button>
      ) : (
        <span className="text-slate-400">-</span>
      )
    },
  ];

  return (
    <>
      <RelatedSection
        title="Dokumentasi DO Ekspedisi"
        description="Data dokumentasi keberangkatan dan kedatangan DO Ekspedisi"
        icon={<Camera />}
      >
        <BaseTable
          data={documentations}
          columns={columns}
          loading={isLoading}
          containerClassName="rounded-lg border"
          headerRowClassName="bg-orange-50"
        />
      </RelatedSection>

      <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
    </>
  );
}
