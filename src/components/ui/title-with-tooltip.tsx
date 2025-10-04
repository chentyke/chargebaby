'use client';

import { Tooltip } from './tooltip';
import { dataDescriptions, type DataDescriptionKey } from '@/lib/data-descriptions';

interface TitleWithTooltipProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export function TitleWithTooltip({ title, className = '', children }: TitleWithTooltipProps) {
  const description = dataDescriptions[title as DataDescriptionKey];
  
  return (
    <>
      <span className={className}>{title}</span>
      {description && <Tooltip content={description} />}
      {children}
    </>
  );
}
