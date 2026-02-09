# Component Contracts: Layout Components

**Feature**: 001-dark-ui-layout  
**Date**: February 9, 2026  
**Purpose**: TypeScript type definitions and prop interfaces for all layout components

## Overview

This document defines the API contracts for all layout-related components. These interfaces ensure type safety and serve as the source of truth for component usage.

---

## Type Definitions

### Color Palette Types

```typescript
/**
 * Dark theme color palette
 */
export interface DarkThemeColors {
  /** Main background color */
  bg: string;
  /** Elevated surface color (cards, panels) */
  surface: string;
  /** Border and divider color */
  border: string;
}

/**
 * Orange accent color variants
 */
export interface OrangeAccentColors {
  /** Primary accent color */
  accent: string;
  /** Hover state color (lighter) */
  hover: string;
  /** Active/pressed state color (darker) */
  active: string;
}

/**
 * Text color hierarchy
 */
export interface TextColors {
  /** Primary text color (highest contrast) */
  primary: string;
  /** Secondary text color (medium contrast) */
  secondary: string;
  /** Muted text color (minimum WCAG AA contrast) */
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
```

---

## Component Interfaces

### Navbar Component

```typescript
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
 * Return value from useNavbar hook
 */
export interface UseNavbarReturn {
  /** Whether the mobile menu is currently open */
  isMobileMenuOpen: boolean;
  /** Function to toggle mobile menu open/closed */
  toggleMobileMenu: () => void;
  /** Function to close mobile menu */
  closeMobileMenu: () => void;
  /** Whether current viewport is mobile size */
  isMobile: boolean;
}
```

**Usage Example**:
```typescript
const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

<Navbar links={navLinks} logo={<Logo />} />
```

---

### TwoColumnLayout Component

```typescript
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
```

**Usage Example**:
```typescript
<TwoColumnLayout
  leftColumn={<MainContent />}
  rightColumn={<Sidebar />}
  gap="lg"
  columnRatio="2:1"
/>
```

---

### Column Component

```typescript
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
```

**Usage Example**:
```typescript
<Column spacing="lg" backgroundColor="surface" border>
  <h2>Column Content</h2>
  <p>Some text...</p>
</Column>
```

---

### Button Component

```typescript
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
```

**Usage Example**:
```typescript
<Button 
  variant="primary" 
  size="md" 
  onClick={() => console.log('clicked')}
  ariaLabel="Submit form"
>
  Submit
</Button>
```

---

## Utility Types

### Responsive Breakpoints

```typescript
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
```

### Class Name Utilities

```typescript
/**
 * Utility function to merge Tailwind class names
 * @param classes - Array of class name strings
 * @returns Merged class name string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
```

---

## Validation Functions

### Navbar Validation

```typescript
/**
 * Validates navigation link data
 * @param link - Navigation link object to validate
 * @returns True if valid, throws error if invalid
 */
export function validateNavLink(link: NavLink): boolean {
  if (!link.label || link.label.trim() === '') {
    throw new Error('NavLink label cannot be empty');
  }
  if (!link.href || link.href.trim() === '') {
    throw new Error('NavLink href cannot be empty');
  }
  if (!/^(\/|https?:\/\/)/.test(link.href)) {
    throw new Error('NavLink href must start with /, http://, or https://');
  }
  return true;
}

/**
 * Validates array of navigation links
 * @param links - Array of navigation links
 * @returns True if all valid, throws error if invalid
 */
export function validateNavLinks(links: NavLink[]): boolean {
  if (!Array.isArray(links) || links.length === 0) {
    throw new Error('Navbar requires at least one link');
  }
  links.forEach(validateNavLink);
  return true;
}
```

### Layout Validation

```typescript
/**
 * Validates column content is provided
 * @param content - React node to validate
 * @param columnName - Name of the column for error messages
 * @returns True if valid, throws error if invalid
 */
export function validateColumnContent(
  content: React.ReactNode,
  columnName: string
): boolean {
  if (content === null || content === undefined) {
    throw new Error(`${columnName} content cannot be null or undefined`);
  }
  return true;
}
```

---

## Constants

### Color Values

```typescript
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
```

### Accessibility

```typescript
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
```

---

## Testing Contracts

### Test Data Factories

```typescript
/**
 * Factory function to create test navigation links
 */
export function createTestNavLink(overrides?: Partial<NavLink>): NavLink {
  return {
    label: 'Test Link',
    href: '/test',
    ...overrides,
  };
}

/**
 * Factory function to create test navbar props
 */
export function createTestNavbarProps(
  overrides?: Partial<NavbarProps>
): NavbarProps {
  return {
    links: [
      createTestNavLink({ label: 'Home', href: '/' }),
      createTestNavLink({ label: 'About', href: '/about' }),
    ],
    ...overrides,
  };
}
```

---

## API Change Log

**Version 1.0.0** - February 9, 2026
- Initial component contracts
- Navbar, TwoColumnLayout, Column, Button interfaces
- Color palette types
- Validation functions
- Test utilities

---

## Migration Guide

*No migrations required - initial version*

---

## Next Steps

1. Implement these interfaces in `src/types/layout.ts`
2. Use interfaces in component implementations
3. Export validation functions from `src/utils/validation.ts`
4. Create test factories in `tests/factories/layout.ts`
5. Update Tailwind config with theme colors
