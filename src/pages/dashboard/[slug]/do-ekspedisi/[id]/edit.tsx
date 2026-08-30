import React from 'react';
import { useRouter } from 'next/router';

export default function DeprecatedEditDOEkspedisiPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  React.useEffect(() => {
    if (router.isReady && slug && id) {
      router.replace(`/dashboard/${slug}/do-ekspedisi/form/${id}`);
    }
  }, [router, slug, id]);

  return null;
}
