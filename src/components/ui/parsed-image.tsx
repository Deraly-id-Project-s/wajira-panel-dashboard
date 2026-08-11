import React from 'react';
import { getParsedImageUrl } from '@/lib/utils/image';

interface ParsedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

export const ParsedImage = ({ src, className, alt = 'Image', ...props }: ParsedImageProps) => {
  const imageUrl = React.useMemo(() => getParsedImageUrl(src), [src]);

  if (!imageUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default ParsedImage;
