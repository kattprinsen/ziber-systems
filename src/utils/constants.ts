import type { GapSize, ColumnRatio, SpacingSize, BackgroundColor, ButtonVariant, ButtonSize } from '../types/layout';

/**
 * Dark theme color palette
 */
export interface DarkThemeColors {
  bg: string;
  surface: string;
  border: string;
}

/**
 * Orange accent color variants
 */
export interface OrangeAccentColors {
  accent: string;
  hover: string;
  active: string;
}

/**
 * Text color hierarchy
 */
export interface TextColors {
  primary: string;
  secondary: string;
  muted: string;
}

/**
 * Complete color palette for the dark UI theme
 */
export interface ColorPalette {
  dark: DarkThemeColors;
  orange: OrangeAccentColors;
  text: TextColors;
}

/**
 * Concrete color values for the dark theme
 */
export const THEME_COLORS: ColorPalette = {
  dark: {
    bg: '#0f0f0f',
    surface: '#1a1a1a',
    border: '#2a2a2a',
  },
  orange: {
    accent: '#FF6B35',
    hover: '#FF8B5A',
    active: '#E55525',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a0',
    muted: '#6b6b6b',
  },
};

/**
 * Mapping of gap sizes to Tailwind classes
 */
export const GAP_SIZE_CLASSES: Record<GapSize, string> = {
  sm: 'gap-4',   // 16px
  md: 'gap-6',   // 24px
  lg: 'gap-8',   // 32px
};

/**
 * Mapping of column ratios to Tailwind grid classes
 */
export const COLUMN_RATIO_CLASSES: Record<ColumnRatio, string> = {
  '1:1': 'md:grid-cols-2',
  '2:1': 'md:grid-cols-[2fr_1fr]',
  '1:2': 'md:grid-cols-[1fr_2fr]',
};

/**
 * Mapping of spacing sizes to Tailwind padding classes
 */
export const SPACING_CLASSES: Record<SpacingSize, string> = {
  none: 'p-0',
  sm: 'p-4',    // 16px
  md: 'p-6',    // 24px
  lg: 'p-8',    // 32px
};

/**
 * Mapping of background colors to Tailwind classes
 */
export const BACKGROUND_CLASSES: Record<BackgroundColor, string> = {
  bg: 'bg-dark-bg',           // #0f0f0f
  surface: 'bg-dark-surface', // #1a1a1a
};

/**
 * Mapping of button variants to Tailwind classes
 */
export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-orange-accent hover:bg-orange-hover active:bg-orange-active text-dark-bg',
  secondary: 'border-2 border-orange-accent text-orange-accent hover:bg-orange-accent/10',
  ghost: 'text-orange-accent hover:bg-orange-accent/5',
};

/**
 * Mapping of button sizes to Tailwind classes
 */
export const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Tailwind responsive breakpoint values
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Breakpoint keys
 */
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * WCAG contrast ratio requirements
 */
export const CONTRAST_RATIOS = {
  /** Minimum for normal text (WCAG AA) */
  NORMAL_TEXT: 4.5,
  /** Minimum for large text (WCAG AA) */
  LARGE_TEXT: 3.0,
  /** Enhanced contrast (WCAG AAA) */
  ENHANCED: 7.0,
} as const;

/**
 * Salary calculation constants
 */
export const SALARY_CONSTANTS = {
  MIN_SALARY: 0,
  MAX_SALARY: 10_000_000,
  WARNING_THRESHOLD_PERCENTAGE: 50,
  DECIMAL_PRECISION: 0,
  DEFAULT_CURRENCY: 'SEK',
  DEFAULT_LOCALE: 'sv-SE',
} as const;

/**
 * Validation error messages
 */
export const SALARY_ERROR_MESSAGES = {
  NEGATIVE_VALUE: 'Salary must be a positive number',
  INVALID_NUMBER: 'Please enter a valid salary amount',
  EXCEEDS_MAX: `Salary exceeds maximum allowed value of ${SALARY_CONSTANTS.MAX_SALARY.toLocaleString('sv-SE')} kr`,
  REQUIRED: 'Current salary is required for calculations',
  NO_SALARY_DATA: 'Employee does not have salary information',
  FUTURE_DATE: 'Effective date cannot be in the future',
  INVALID_DATE: 'Please provide a valid date',
} as const;

/**
 * Utility function to merge Tailwind class names
 * @param classes - Array of class name strings
 * @returns Merged class name string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
