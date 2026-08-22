import React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ImagePreviewProps {
  open: boolean;
  onClose: () => void;
  src: string | null;
}

/** Component preview image interaktif menggunakan yet-another-react-lightbox */
export function ImagePreview({ open, onClose, src }: ImagePreviewProps) {
  if (!src) return null;

  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src }]}
      render={{
        buttonPrev: () => null, // Sembunyikan navigasi jika hanya satu slide
        buttonNext: () => null,
      }}
    />
  );
}
