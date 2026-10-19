import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoadingState } from '@/components/ui/loading-state';

interface PageLoadingOptions {
  text?: React.ReactNode;
}

interface PageLoadingContextValue {
  isLoading: boolean;
  loadingText: React.ReactNode;
  showLoading: (text?: React.ReactNode) => void;
  hideLoading: () => void;
}

const PageLoadingContext = createContext<PageLoadingContextValue | undefined>(undefined);

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loadingCount, setLoadingCount] = useState(0);
  const [loadingText, setLoadingText] = useState<React.ReactNode>('Menyimpan data...');

  const showLoading = useCallback((text: React.ReactNode = 'Menyimpan data...') => {
    setLoadingText(text);
    setLoadingCount((prev) => prev + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const handleRouteChangeComplete = () => {
      setLoadingCount(0);
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeComplete);
    };
  }, [router]);

  const value = useMemo(
    () => ({
      isLoading: loadingCount > 0,
      loadingText,
      showLoading,
      hideLoading,
    }),
    [loadingCount, loadingText, showLoading, hideLoading],
  );

  return (
    <PageLoadingContext.Provider value={value}>
      {children}
      {loadingCount > 0 && (
        <LoadingState
          variant="fullscreen"
          loaderType="bounce"
          text={loadingText}
          className="z-[9999]"
        />
      )}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);
  if (!context) {
    throw new Error('usePageLoading must be used within a PageLoadingProvider');
  }
  return context;
}
