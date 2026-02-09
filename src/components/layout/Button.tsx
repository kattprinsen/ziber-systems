import type { ButtonProps } from '../../types/layout';
import { BUTTON_VARIANT_CLASSES, BUTTON_SIZE_CLASSES } from '../../utils/constants';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ariaLabel,
}: ButtonProps) {
  const variantClass = BUTTON_VARIANT_CLASSES[variant];
  const sizeClass = BUTTON_SIZE_CLASSES[size];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${variantClass} ${sizeClass} ${disabledClass} rounded-md font-medium transition-colors duration-200 focus-orange ${className}`}
    >
      {children}
    </button>
  );
}
