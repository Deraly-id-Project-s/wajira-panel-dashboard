/**
 * Helper to parse image URL from backend relative path or absolute URL.
 * Automatically prepends the base URL and '/storage/' prefix if missing.
 */
export function getParsedImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-finance.wajiracorps.co.id';
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  
  if (cleanPath.startsWith('storage/')) {
    return `${cleanBase}/${cleanPath}`;
  }
  return `${cleanBase}/storage/${cleanPath}`;
}
