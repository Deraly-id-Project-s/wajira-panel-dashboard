import React from 'react';
import type { ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import lightGallery from 'lightgallery';
import lgZoom from 'lightgallery/plugins/zoom';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';

const storageUrl = process.env.OBJECT_BUCKET_URL || 'http://localhost:9000';
const bucketName = process.env.OBJECT_BUKCET || 'wajirafs';

/** Resolves an object-storage path to {OBJECT_BUCKET_URL}/{OBJECT_BUKCET}/{path}. */
export function getObjectStorageUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, '');
  const cleanBucket = bucketName.replace(/^\/+|\/+$/g, '');
  const pathWithBucket = cleanPath === cleanBucket || cleanPath.startsWith(`${cleanBucket}/`)
    ? cleanPath
    : `${cleanBucket}/${cleanPath}`;

  return `${storageUrl.replace(/\/+$/, '')}/${pathWithBucket}`;
}

type StorageImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  /** Enables LightGallery controls for previewing, zooming, and downloading the image. */
  lightbox?: boolean;
  lightboxTitle?: string;
};

export function StorageImage({ src, alt, lightbox = false, lightboxTitle, ...props }: StorageImageProps) {
  const imageUrl = getObjectStorageUrl(src);
  const galleryItemRef = React.useRef<HTMLAnchorElement | null>(null);
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  React.useEffect(() => {
    if (!lightbox || !imageUrl || imageError || !galleryItemRef.current) return undefined;

    const galleryItem = galleryItemRef.current;
    const gallery = lightGallery(galleryItemRef.current, {
      plugins: [lgZoom],
      licenseKey: '0000-0000-000-0000',
      download: true,
      zoom: true,
      showZoomInOutIcons: true,
      actualSize: true,
      speed: 300,
    });

    const handleDownload = async (event: Event) => {
      event.preventDefault();

      try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Gagal mengunduh gambar (${response.status})`);

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        const extension = blob.type.split('/')[1] || 'jpg';
        const filename = (lightboxTitle || alt || 'image')
          .trim()
          .replace(/[^a-z0-9-_]+/gi, '-')
          .replace(/^-+|-+$/g, '') || 'image';

        anchor.href = objectUrl;
        anchor.download = `${filename}.${extension}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.error('Gagal mengunduh gambar dari object storage.', error);
      }
    };

    const handleAfterOpen = () => {
      const downloadButton = document.querySelector<HTMLElement>('.lg-download');
      downloadButton?.addEventListener('click', handleDownload);
    };

    galleryItem.addEventListener('lgAfterOpen', handleAfterOpen);

    return () => {
      galleryItem.removeEventListener('lgAfterOpen', handleAfterOpen);
      document.querySelector<HTMLElement>('.lg-download')?.removeEventListener('click', handleDownload);
      gallery.destroy();
    };
  }, [alt, imageError, imageUrl, lightbox, lightboxTitle]);

  if (!imageUrl || imageError) {
    return (
      <div
        role="img"
        aria-label={alt || 'Gambar tidak tersedia'}
        className={`flex min-h-24 items-center justify-center bg-slate-100 text-slate-400 ${props.className || ''}`}
      >
        <ImageOff className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  const image = (
    <img
      {...props}
      src={imageUrl}
      alt={alt}
      onError={(event) => {
        props.onError?.(event);
        setImageError(true);
      }}
    />
  );

  if (!lightbox) return image;

  return (
    <a
      ref={galleryItemRef}
      href={imageUrl}
      data-src={imageUrl}
      aria-label={lightboxTitle || alt || 'Buka gambar'}
      className="block cursor-zoom-in"
    >
      {image}
    </a>
  );
}
