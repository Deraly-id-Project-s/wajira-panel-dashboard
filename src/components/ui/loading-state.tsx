import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { BounceLoader } from './bounce-loader';
import { HashLoader } from './hash-loader';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  /**
   * Variasi tampilan loading state.
   * - `page`: Memusatkan loading secara vertikal dan horizontal dengan tinggi minimal 50vh.
   * - `section`: Loading dengan padding menengah (py-10). Cocok untuk di dalam card.
   * - `inline`: Loading tanpa margin/padding (inline flex).
   * - `fullscreen`: Menutupi seluruh layar dengan backdrop semi transparan.
   * @default "page"
   */
  variant?: 'page' | 'section' | 'inline' | 'fullscreen';
  /**
   * Tipe loader icon: 'bounce' (BounceLoader), 'spin' (Loader2), atau 'hash' (HashLoader).
   * @default "bounce"
   */
  loaderType?: 'bounce' | 'spin' | 'hash';
  /**
   * Teks yang ditampilkan di bawah atau di samping spinner.
   * Berikan nilai `null` untuk menyembunyikan teks.
   * @default "Memuat data..." (untuk variant page, section, fullscreen)
   */
  text?: React.ReactNode | null;
  /**
   * Tambahan class untuk container (pembungkus) loading.
   */
  className?: string;
  /**
   * Tambahan class untuk ikon spinner (misal untuk merubah warna/ukuran).
   */
  iconClassName?: string;
}

export function LoadingState({
  variant = 'page',
  loaderType = 'bounce',
  text,
  className,
  iconClassName,
}: LoadingStateProps) {
  const isInline = variant === 'inline';
  const effectiveLoaderType = loaderType;

  // Set default text jika tidak secara eksplisit di-set null
  const defaultText = text === undefined && !isInline ? 'Memuat data...' : text;

  const getContainerClassName = () => {
    switch (variant) {
      case 'fullscreen':
        return 'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm';
      case 'page':
        return 'flex h-[50vh] min-h-[300px] flex-col items-center justify-center gap-4';
      case 'section':
        return 'flex flex-col items-center justify-center gap-3 py-10';
      case 'inline':
        return 'inline-flex items-center gap-2';
      default:
        return '';
    }
  };

  const getIconClassName = () => {
    switch (variant) {
      case 'fullscreen':
      case 'page':
        return 'h-8 w-8 text-muted-foreground';
      case 'section':
        return 'h-6 w-6 text-muted-foreground';
      case 'inline':
        return 'h-4 w-4 text-muted-foreground';
      default:
        return 'h-5 w-5';
    }
  };

  const getBounceSize = () => {
    switch (variant) {
      case 'fullscreen':
      case 'page':
        return 48;
      case 'section':
        return 36;
      case 'inline':
        return 18;
      default:
        return 32;
    }
  };

  const getHashSize = () => {
    switch (variant) {
      case 'fullscreen':
      case 'page':
        return 36;
      case 'section':
        return 28;
      case 'inline':
        return 16;
      default:
        return 24;
    }
  };

  const renderLoader = () => {
    if (effectiveLoaderType === 'bounce') {
      return <BounceLoader size={getBounceSize()} className={iconClassName} />;
    }
    if (effectiveLoaderType === 'hash') {
      return <HashLoader size={getHashSize()} className={iconClassName} />;
    }
    return <Loader2 className={cn('animate-spin', getIconClassName(), iconClassName)} />;
  };

  return (
    <div className={cn(getContainerClassName(), className)}>
      {renderLoader()}
      {defaultText !== null && (
        <p className={cn('text-sm text-muted-foreground animate-pulse', isInline && 'text-xs')}>
          {defaultText}
        </p>
      )}
    </div>
  );
}
