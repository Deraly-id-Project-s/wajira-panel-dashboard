import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CopyBoxProps {
  text: string;
  className?: string;
  href?: string;
}

export function CopyBox({ text, className, href }: CopyBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      //
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-2 print:block print:w-full print:whitespace-normal', className)}>
      <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm font-medium text-gray-900 select-none print:p-0 print:border-none print:bg-transparent print:break-all print:whitespace-pre-wrap">
        {text}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-md bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors print:hidden cursor-pointer"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-md bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors print:hidden cursor-pointer"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
