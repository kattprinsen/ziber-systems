import type { ColumnProps } from '../../types/layout';
import { SPACING_CLASSES, BACKGROUND_CLASSES } from '../../utils/constants';

export function Column({
  children,
  spacing = 'md',
  backgroundColor = 'surface',
  border = false,
  className = '',
}: ColumnProps) {
  const spacingClass = SPACING_CLASSES[spacing];
  const bgClass = BACKGROUND_CLASSES[backgroundColor];
  const borderClass = border ? 'border border-dark-border' : '';

  return (
    <div className={`${bgClass} ${spacingClass} ${borderClass} rounded-lg ${className}`}>
      {children}
    </div>
  );
}
