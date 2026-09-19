import React from 'react';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface TextTruncateProps {
  text: string;
  maxLength: number;
  className?: string;
  showTooltip?: boolean;
}

export function TextTruncate({
  text,
  maxLength,
  className,
  showTooltip = true,
}: TextTruncateProps) {
  if (!text || text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  const truncated = `${text.slice(0, maxLength)}...`;

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
