import React from 'react';
import { useRouter } from 'next/router';

export default function DeprecatedDOEkspedisiPrintPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  React.useEffect(() => {
    if (router.isReady && slug && id) {
      router.replace(`/dashboard/${slug}/do-ekspedisi/detail/${id}`);
    }
  }, [router.isReady, slug, id]);

  return null;
}
