import React from 'react';

/**
 * Navigation link data structure
 */
export interface NavLink {
  /** Display text for the link */
  label: string;
  /** Navigation path or URL */
  href: string;
  /** Optional icon element to display before label */
  icon?: React.ReactNode;
}

/**
 * Props for the Navbar component
 */
export interface NavbarProps {
  /** Array of navigation links to display */
  links: NavLink[];
  /** Optional logo element (image or text) */
  logo?: React.ReactNode;
  /** Viewport width breakpoint for mobile menu (default: 768) */
  mobileBreakpoint?: number;
  /** Additional Tailwind CSS classes */
  className?: string;
}

/**
 * Gap size options for column spacing
 */
export type GapSize = 'sm' | 'md' | 'lg';

/**
 * Column width ratio options
 */
export type ColumnRatio = '1:1' | '2:1' | '1:2';

/**
 * Props for the TwoColumnLayout component
 */
export interface TwoColumnLayoutProps {
  /** Content to render in the left column */
  leftColumn: React.ReactNode;
  /** Content to render in the right column */
  rightColumn: React.ReactNode;
  /** Spacing between columns (default: 'md') */
  gap?: GapSize;
  /** Whether to stack columns vertically on mobile (default: true) */
  stackOnMobile?: boolean;
  /** Width ratio between columns on desktop (default: '1:1') */
  columnRatio?: ColumnRatio;
  /** Additional Tailwind CSS classes */
  className?: string;
}

/**
 * Spacing options for column padding
 */
export type SpacingSize = 'none' | 'sm' | 'md' | 'lg';

/**
 * Background color options for columns
 */
export type BackgroundColor = 'bg' | 'surface';

/**
 * Props for the Column component
 */
export interface ColumnProps {
  /** Content to render inside the column */
  children: React.ReactNode;
  /** Internal padding (default: 'md') */
  spacing?: SpacingSize;
  /** Background color variant (default: 'surface') */
  backgroundColor?: BackgroundColor;
  /** Whether to show border (default: false) */
  border?: boolean;
  /** Additional Tailwind CSS classes */
  className?: string;
}

/**
 * Button style variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Button size options
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button HTML types
 */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * Props for the Button component
 */
export interface ButtonProps {
  /** Button content (text, icons, etc.) */
  children: React.ReactNode;
  /** Visual style variant (default: 'primary') */
  variant?: ButtonVariant;
  /** Size of the button (default: 'md') */
  size?: ButtonSize;
  /** Click handler function */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Whether button is disabled (default: false) */
  disabled?: boolean;
  /** HTML button type attribute (default: 'button') */
  type?: ButtonType;
  /** Additional Tailwind CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}
