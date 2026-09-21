const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com';
const objectBucketUrl = process.env.OBJECT_BUCKET_URL || '';
const objectBucketName = process.env.OBJECT_BUKCET || 'wajirafs';

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function normalizeObjectStorageUrl(url: string) {
  if (!objectBucketUrl || !objectBucketName) return url;

  try {
    const parsedUrl = new URL(url);
    const cleanBucket = objectBucketName.replace(/^\/+|\/+$/g, '');
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const bucketIndex = pathParts.indexOf(cleanBucket);

    if (bucketIndex === -1) return url;

    return joinUrl(objectBucketUrl, pathParts.slice(bucketIndex).join('/'));
  } catch {
    return url;
  }
}

/**
 * Resolves image values from the backend into browser-loadable URLs.
 * Supports API /storage paths, object-storage bucket paths, and local previews.
 */
export function getParsedImageUrl(path?: string | null): string {
  if (!path) return '';

  const trimmedPath = path.trim();
  if (!trimmedPath) return '';

  if (/^(data:|blob:)/i.test(trimmedPath)) return trimmedPath;
  if (/^https?:\/\//i.test(trimmedPath)) return normalizeObjectStorageUrl(trimmedPath);

  const cleanPath = trimmedPath.replace(/^\/+/, '');
  const cleanBucket = objectBucketName.replace(/^\/+|\/+$/g, '');

  if (cleanBucket && (cleanPath === cleanBucket || cleanPath.startsWith(`${cleanBucket}/`))) {
    return objectBucketUrl
      ? joinUrl(objectBucketUrl, cleanPath)
      : joinUrl(apiBaseUrl, cleanPath);
  }

  if (cleanPath.startsWith('storage/')) {
    return joinUrl(apiBaseUrl, cleanPath);
  }

  return joinUrl(apiBaseUrl, `storage/${cleanPath}`);
}
