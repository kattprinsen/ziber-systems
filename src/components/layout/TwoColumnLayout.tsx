import type { TwoColumnLayoutProps } from '../../types/layout';
import { GAP_SIZE_CLASSES, COLUMN_RATIO_CLASSES } from '../../utils/constants';

export function TwoColumnLayout({
  leftColumn,
  rightColumn,
  gap = 'md',
  stackOnMobile = true,
  columnRatio = '1:1',
  className = '',
}: TwoColumnLayoutProps) {
  const gapClass = GAP_SIZE_CLASSES[gap];
  const ratioClass = COLUMN_RATIO_CLASSES[columnRatio];
  const mobileClass = stackOnMobile ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid ${mobileClass} ${ratioClass} ${gapClass} ${className}`}>
      <div className="col-span-1">{leftColumn}</div>
      <div className="col-span-1">{rightColumn}</div>
    </div>
  );
}
