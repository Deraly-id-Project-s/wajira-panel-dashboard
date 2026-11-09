import React from 'react';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface TextTruncateProps {
  text: string;
  maxLength?: number;
  maxWords?: number;
  className?: string;
  showTooltip?: boolean;
}

export function TextTruncate({
  text,
  maxLength,
  maxWords,
  className,
  showTooltip = true,
}: TextTruncateProps) {
  if (!text) {
    return <span className={className}>{text}</span>;
  }

  let isTruncated = false;
  let truncated = text;

  if (typeof maxWords === 'number' && maxWords > 0) {
    const words = text.trim().split(/\s+/);
    if (words.length > maxWords) {
      isTruncated = true;
      truncated = `${words.slice(0, maxWords).join(' ')}...`;
    }
  } else if (typeof maxLength === 'number' && maxLength > 0) {
    if (text.length > maxLength) {
      isTruncated = true;
      truncated = `${text.slice(0, maxLength)}...`;
    }
  }

  if (!isTruncated) {
    return <span className={className}>{text}</span>;
  }

  if (!showTooltip) {
    return (
      <span className={className} title={text}>
        {truncated}
      </span>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs break-words">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
