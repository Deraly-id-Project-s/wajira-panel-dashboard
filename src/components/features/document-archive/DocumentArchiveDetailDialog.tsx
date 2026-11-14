import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, History } from 'lucide-react';
import type { DocumentArchive } from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_LABELS } from '@/@types/document-archive.types';
import { formatDate } from '@/components/ui/format-date';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentArchive: DocumentArchive | null;
  onSelectRevision?: (item: DocumentArchive) => void;
}

export function DocumentArchiveDetailDialog({
  open,
  onOpenChange,
  documentArchive,
  onSelectRevision,
}: Props) {
  if (!documentArchive) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3 text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              {documentArchive.documentCode || 'KODE OTOMATIS'}
            </span>
            {documentArchive.isLatest ? (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                Versi Terbaru
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
                Revisi Lama
              </Badge>
            )}
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs capitalize">
              {DOCUMENT_ARCHIVE_TYPE_LABELS[documentArchive.type] ?? documentArchive.type}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold mt-2 text-slate-900">
            {documentArchive.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            UUID: <span className="font-mono">{documentArchive.uuid}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-3 text-sm">
          {/* Card Berkas File */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">Berkas Dokumen</p>
                <p className="font-mono text-xs text-slate-500 truncate max-w-xs">{documentArchive.file}</p>
              </div>
            </div>
            {documentArchive.fileUrl ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(documentArchive.fileUrl!, '_blank')}
                className="gap-1.5 text-xs font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Lihat Berkas
              </Button>
            ) : (
              <span className="text-xs text-slate-400 italic">URL tidak tersedia</span>
            )}
          </div>

          {/* Grid Informasi */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Nomor Dokumen</p>
              <p className="font-semibold text-slate-800 mt-0.5">#{documentArchive.documentNumber || '-'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Format Berkas</p>
              <p className="font-semibold text-slate-800 uppercase mt-0.5">{documentArchive.format || '-'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Status Aktif</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {documentArchive.isActive ? (
                  <span className="text-emerald-600">Aktif</span>
                ) : (
                  <span className="text-slate-500">Nonaktif</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Status Kedaluwarsa</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {documentArchive.isExpired ? (
                  <span className="text-rose-600">Kedaluwarsa</span>
                ) : (
                  <span className="text-emerald-600">Berlaku</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Tanggal Dibuat</p>
              <p className="text-slate-700 mt-0.5">
                {formatDate(documentArchive.createdAt, true)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Berlaku Sampai</p>
              <p className="text-slate-700 mt-0.5">
                {documentArchive.expiredAt
                  ? formatDate(documentArchive.expiredAt)
                  : 'Selamanya / Tidak Ditentukan'}
              </p>
            </div>
          </div>

          {/* Catatan */}
          {documentArchive.notes && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-slate-400">Catatan Tambahan</p>
              <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap rounded-md bg-slate-50 p-2.5 border border-slate-100">
                {documentArchive.notes}
              </p>
            </div>
          )}

          {/* Rantai Revisi */}
          {((documentArchive.revisions && documentArchive.revisions.length > 0) || documentArchive.previousDocument) && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <History className="h-4 w-4 text-blue-600" />
                <span>Riwayat Rantai Revisi</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {documentArchive.previousDocument && (
                  <div className="flex items-center justify-between text-xs p-2 rounded bg-amber-50/60 border border-amber-200">
                    <div>
                      <span className="font-medium text-amber-900">Versi Induk/Sebelumnya: </span>
                      <span className="font-mono text-slate-700">{documentArchive.previousDocument.documentCode}</span>
                    </div>
                    {onSelectRevision && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectRevision(documentArchive.previousDocument!)}
                        className="h-6 text-[11px] px-2"
                      >
                        Lihat
                      </Button>
                    )}
                  </div>
                )}
                {documentArchive.revisions?.map((rev) => (
                  <div key={rev.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-200">
                    <div>
                      <span className="font-mono font-medium text-slate-800">{rev.documentCode}</span>
                      <span className="text-slate-500 ml-2">{rev.name}</span>
                    </div>
                    {onSelectRevision && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectRevision(rev)}
                        className="h-6 text-[11px] px-2"
                      >
                        Lihat
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
