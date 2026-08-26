import type { ImgHTMLAttributes } from 'react';

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
};

export function StorageImage({ src, alt, ...props }: StorageImageProps) {
  const imageUrl = getObjectStorageUrl(src);
  if (!imageUrl) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} src={imageUrl} alt={alt} />;
}
