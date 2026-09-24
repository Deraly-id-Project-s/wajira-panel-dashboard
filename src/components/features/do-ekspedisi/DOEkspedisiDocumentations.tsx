import React from 'react';
import { Camera, FileCheck2, FileText, PackageCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { ImagePreview } from '@/components/ui/image-preview';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { TextTruncate } from '@/components/ui/text-truncate';
import type { DoEkspedisi, DoEkspedisiDocumentation } from '@/@types/do-ekspedisi.types';

interface DOEkspedisiDocumentationsProps {
  data: DoEkspedisi;
}

const documentationGroups = [
  {
    title: 'Dokumentasi Keberangkatan',
    description: 'Dokumen proses mounting dan dokumen pengiriman awal',
    icon: Camera,
    types: ['mounting_process', 'mounting_done', 'delivery_ducument'],
  },
  {
    title: 'Dokumentasi Penyelesaian',
    description: 'Dokumen proses unmount dan bukti pengiriman selesai',
    icon: PackageCheck,
    types: ['unmount_process', 'delivery_document_complete'],
  },
  {
    title: 'Dokumentasi Lainnya',
    description: 'Dokumentasi tambahan di luar proses utama ekspedisi',
    icon: FileText,
    types: ['other'],
  },
] as const;

const documentationTypeLabel: Record<string, string> = {
  mounting_process: 'Mounting Process',
  mounting_done: 'Mounting Done',
  delivery_ducument: 'Delivery Document',
  unmount_process: 'Unmount Process',
  delivery_document_complete: 'Delivery Document Complete',
  other: 'Other',
};

const knownPrimaryDocumentationTypes = new Set([
  'mounting_process',
  'mounting_done',
  'delivery_ducument',
  'unmount_process',
  'delivery_document_complete',
]);

const getDocumentationType = (item: DoEkspedisiDocumentation) => {
  const type = item.documentationType || item.documentationPosition || 'other';
  return String(type).toLowerCase();
};

function DocumentationItem({
  item,
  onPreview,
}: {
  item: DoEkspedisiDocumentation;
  onPreview: (url: string) => void;
}) {
  const type = getDocumentationType(item);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Badge variant="outline" className="w-fit border-orange-200 bg-orange-50 text-orange-700">
            {documentationTypeLabel[type] ?? type.replace(/_/g, ' ')}
          </Badge>
          <div>
            <p className="font-semibold text-slate-950">{item.subject || '-'}</p>
            <TextTruncate text={item.description || '-'} maxLength={90} className="mt-1 text-sm leading-relaxed text-slate-500" />
          </div>
        </div>
        {item.image ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={() => onPreview(getObjectStorageUrl(item.image))}
          >
            <FileCheck2 className="h-4 w-4" />
            Lihat Gambar
          </Button>
        ) : (
          <span className="shrink-0 text-sm text-slate-400">Tidak ada gambar</span>
        )}
      </div>
    </div>
  );
}

export function DOEkspedisiDocumentations({ data }: DOEkspedisiDocumentationsProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const documentations = data.expeditionDocumentations ?? [];

  return (
    <>
      <div className="space-y-4">
        {documentationGroups.map((group) => {
          const items = documentations.filter((item) => {
            const type = getDocumentationType(item);
            if (group.title === 'Dokumentasi Lainnya') {
              return type === 'other' || !knownPrimaryDocumentationTypes.has(type);
            }
            return (group.types as readonly string[]).includes(type);
          });

          return (
            <CollapsibleBox
              key={group.title}
              title={group.title}
              description={`${group.description} (${items.length} dokumen)`}
              icon={group.icon}
              defaultExpanded={group.title !== 'Dokumentasi Lainnya' || items.length > 0}
              className="rounded-md shadow-sm"
              headerClassName="px-4 py-3 sm:px-5"
              contentClassName="p-4 sm:p-5"
            >
              {items.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {items.map((item) => (
                    <DocumentationItem key={item.uuid ?? item.id} item={item} onPreview={setPreviewUrl} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  Belum ada dokumentasi pada kelompok ini.
                </div>
              )}
            </CollapsibleBox>
          );
        })}
      </div>

      <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
    </>
  );
}
