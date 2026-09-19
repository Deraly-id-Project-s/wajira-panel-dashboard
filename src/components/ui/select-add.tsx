'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SelectAddProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onAdd?: () => void;
  addHref?: string;
  allowAdd?: boolean;
  addLabel?: string;
  addDisabled?: boolean;
  addVariant?: ButtonProps['variant'];
  addIcon?: React.ReactNode;
  containerClassName?: string;
}

export function SelectAdd({
  children,
  onAdd,
  addHref,
  allowAdd = true,
  addLabel = 'Tambah data',
  addDisabled = false,
  addVariant = 'default',
  addIcon,
  containerClassName,
  className,
  ...props
}: SelectAddProps) {
  const showAdd = allowAdd && (Boolean(onAdd) || Boolean(addHref));
  const iconNode = addIcon || <Plus className="h-4 w-4" />;

  return (
    <div
      className={cn(
        showAdd
          ? 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2'
          : 'w-full min-w-0',
        containerClassName || className
      )}
      {...props}
    >
      <div className="w-full min-w-0">{children}</div>

      {showAdd &&
        (addHref && !addDisabled ? (
          <Button
            asChild
            variant={addVariant}
            size="icon"
            disabled={addDisabled}
            aria-label={addLabel}
            title={addLabel}
            className="h-10 w-10 shrink-0"
          >
            <Link href={addHref}>
              {iconNode}
              <span className="sr-only">{addLabel}</span>
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant={addVariant}
            size="icon"
            disabled={addDisabled}
            aria-label={addLabel}
            title={addLabel}
            onClick={onAdd}
            className="h-10 w-10 shrink-0"
          >
            {iconNode}
            <span className="sr-only">{addLabel}</span>
          </Button>
        ))}
    </div>
  );
}
