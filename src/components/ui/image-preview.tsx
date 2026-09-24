import React from 'react';
import { ImageOff } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

interface ImagePreviewProps {
  open: boolean;
  onClose: () => void;
  src: string | null;
}

/** Component preview image interaktif menggunakan yet-another-react-lightbox */
export function ImagePreview({ open, onClose, src }: ImagePreviewProps) {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
    if (!open || !src) return undefined;

    const image = new Image();
    image.onload = () => setImageError(false);
    image.onerror = () => setImageError(true);
    image.src = src;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [open, src]);

  if (!open) return null;

  if (!src || imageError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" role="dialog" aria-label="Preview gambar">
        <div className="flex flex-col items-center gap-3 rounded-lg bg-white px-8 py-7 text-center text-slate-500 shadow-xl">
          <ImageOff className="h-12 w-12 text-slate-400" aria-hidden="true" />
          <p>Gambar tidak tersedia atau gagal dimuat.</p>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const downloadImage = async ({
    saveAs,
  }: {
    saveAs: (source: string | Blob, name?: string) => void;
  }) => {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Gagal mengunduh gambar (${response.status})`);

      const blob = await response.blob();
      const extension = blob.type.split('/')[1] || 'jpg';
      saveAs(blob, `gambar-preview-${Date.now()}.${extension}`);
    } catch (error) {
      console.error('Gagal mengunduh gambar.', error);
    }
  };

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src, download: true }]}
      plugins={[Download, Zoom]}
      download={{ download: ({ saveAs }) => void downloadImage({ saveAs }) }}
      labels={{ Download: 'Simpan' }}
      render={{
        buttonPrev: () => null, // Sembunyikan navigasi jika hanya satu slide
        buttonNext: () => null,
      }}
    />
  );
}
