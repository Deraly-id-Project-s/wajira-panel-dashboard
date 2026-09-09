import { ReactNode } from 'react';

interface PrintLetterPageProps {
  id?: string;
  letterheadSrc?: string;
  children: ReactNode;
  className?: string;
}

export function PrintLetterPage({ id, letterheadSrc, children, className }: PrintLetterPageProps) {
  return (
    <div id={id} className={`print-letter-page ${className || ''}`.trim()}>
      {letterheadSrc && (
        // A plain image supports runtime object-storage URLs without requiring
        // every tenant bucket hostname in Next.js remote image configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={letterheadSrc}
          alt=""
          aria-hidden
          className="print-letterhead"
        />
      )}

      <div className="print-letter-content">{children}</div>
    </div>
  );
}
