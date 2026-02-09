# Quickstart Guide: Dark Mode UI Layout Implementation

**Feature**: 001-dark-ui-layout  
**Branch**: `001-dark-ui-layout`  
**Date**: February 9, 2026  
**For**: Developers implementing the dark theme two-column layout

## Prerequisites

- Node.js 18+ installed
- npm 9+ or yarn 1.22+
- Git checkout of branch `001-dark-ui-layout`
- Familiarity with React, TypeScript, and Tailwind CSS

---

## Step 1: Install Dependencies

Install Tailwind CSS and related dependencies:

```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

Initialize Tailwind configuration:

```bash
npx tailwindcss init -p
```

This creates:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

---

## Step 2: Configure Tailwind

Update `tailwind.config.js` with the following:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
    },
  },
  plugins: [],
}
```

---

## Step 3: Add Tailwind Directives

Update `src/index.css` to include Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Root styles for dark theme */
@layer base {
  body {
    @apply bg-dark-bg text-text-primary;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Custom utility classes */
@layer utilities {
  .focus-orange {
    @apply focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-offset-2 focus:ring-offset-dark-bg;
  }
}
```

---

## Step 4: Create Type Definitions

Create `src/types/layout.ts`:

```typescript
export interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavbarProps {
  links: NavLink[];
  logo?: React.ReactNode;
  className?: string;
}

export type GapSize = 'sm' | 'md' | 'lg';
export type ColumnRatio = '1:1' | '2:1' | '1:2';

export interface TwoColumnLayoutProps {
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  gap?: GapSize;
  stackOnMobile?: boolean;
  columnRatio?: ColumnRatio;
  className?: string;
}

export type SpacingSize = 'none' | 'sm' | 'md' | 'lg';
export type BackgroundColor = 'bg' | 'surface';

export interface ColumnProps {
  children: React.ReactNode;
  spacing?: SpacingSize;
  backgroundColor?: BackgroundColor;
  border?: boolean;
  className?: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  ariaLabel?: string;
}
```

---

## Step 5: Create Layout Components

### 5.1 Create Navbar Component

Create `src/components/layout/Navbar.tsx`:

```typescript
import { useState } from 'react';
import { NavbarProps } from '../../types/layout';

export function Navbar({ links, logo, className = '' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className={`bg-dark-surface border-b border-dark-border ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo || <span className="text-xl font-bold text-orange-accent">Logo</span>}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-text-secondary hover:text-orange-accent transition-colors duration-200 focus-orange"
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-text-primary hover:text-orange-accent focus-orange"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-dark-bg border-t border-dark-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="block px-3 py-2 text-text-secondary hover:text-orange-accent hover:bg-dark-surface rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
```

### 5.2 Create TwoColumnLayout Component

Create `src/components/layout/TwoColumnLayout.tsx`:

```typescript
import { TwoColumnLayoutProps } from '../../types/layout';

const GAP_CLASSES = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
};

const RATIO_CLASSES = {
  '1:1': 'md:grid-cols-2',
  '2:1': 'md:grid-cols-[2fr_1fr]',
  '1:2': 'md:grid-cols-[1fr_2fr]',
};

export function TwoColumnLayout({
  leftColumn,
  rightColumn,
  gap = 'md',
  stackOnMobile = true,
  columnRatio = '1:1',
  className = '',
}: TwoColumnLayoutProps) {
  const gapClass = GAP_CLASSES[gap];
  const ratioClass = RATIO_CLASSES[columnRatio];
  const mobileClass = stackOnMobile ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid ${mobileClass} ${ratioClass} ${gapClass} ${className}`}>
      <div className="col-span-1">{leftColumn}</div>
      <div className="col-span-1">{rightColumn}</div>
    </div>
  );
}
```

### 5.3 Create Column Component

Create `src/components/layout/Column.tsx`:

```typescript
import { ColumnProps } from '../../types/layout';

const SPACING_CLASSES = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const BG_CLASSES = {
  bg: 'bg-dark-bg',
  surface: 'bg-dark-surface',
};

export function Column({
  children,
  spacing = 'md',
  backgroundColor = 'surface',
  border = false,
  className = '',
}: ColumnProps) {
  const spacingClass = SPACING_CLASSES[spacing];
  const bgClass = BG_CLASSES[backgroundColor];
  const borderClass = border ? 'border border-dark-border' : '';

  return (
    <div className={`${bgClass} ${spacingClass} ${borderClass} rounded-lg ${className}`}>
      {children}
    </div>
  );
}
```

### 5.4 Create Button Component

Create `src/components/layout/Button.tsx`:

```typescript
import { ButtonProps } from '../../types/layout';

const VARIANT_CLASSES = {
  primary: 'bg-orange-accent hover:bg-orange-hover active:bg-orange-active text-dark-bg',
  secondary: 'border-2 border-orange-accent text-orange-accent hover:bg-orange-accent/10',
  ghost: 'text-orange-accent hover:bg-orange-accent/5',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

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
  const variantClass = VARIANT_CLASSES[variant];
  const sizeClass = SIZE_CLASSES[size];
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
```

---

## Step 6: Update App Component

Update `src/App.tsx` to use the new layout:

```typescript
import { Navbar } from './components/layout/Navbar';
import { TwoColumnLayout } from './components/layout/TwoColumnLayout';
import { Column } from './components/layout/Column';
import { Button } from './components/layout/Button';
import { NavLink } from './types/layout';

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

function App() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar links={navLinks} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TwoColumnLayout
          leftColumn={
            <Column spacing="lg" border>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Left Column
              </h2>
              <p className="text-text-secondary mb-6">
                This is the left column content with dark theme styling.
              </p>
              <Button variant="primary">
                Primary Action
              </Button>
            </Column>
          }
          rightColumn={
            <Column spacing="lg" border>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Right Column
              </h2>
              <p className="text-text-secondary mb-6">
                This is the right column content.
              </p>
              <Button variant="secondary">
                Secondary Action
              </Button>
            </Column>
          }
          gap="lg"
        />
      </main>
    </div>
  );
}

export default App;
```

---

## Step 7: Install Testing Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Update `package.json` to add test script:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
});
```

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

---

## Step 8: Run Development Server

Start the dev server to see your changes:

```bash
npm run dev
```

Visit `http://localhost:5173` to view the dark-themed layout.

---

## Step 9: Verify Implementation

### Visual Checklist

- [ ] Page background is dark (#0f0f0f)
- [ ] Navbar is visible at the top with dark surface background
- [ ] Navigation links turn orange on hover
- [ ] Two columns are displayed side-by-side on desktop
- [ ] Columns stack vertically on mobile (<768px)
- [ ] Orange accent color is clearly visible on buttons
- [ ] Text is readable with sufficient contrast
- [ ] Mobile menu opens/closes correctly
- [ ] Focus states show orange ring on keyboard navigation

### Accessibility Checklist

- [ ] Tab through all interactive elements
- [ ] All text meets WCAG AA contrast ratios (use browser dev tools)
- [ ] Mobile menu accessible via keyboard
- [ ] Buttons have clear focus indicators
- [ ] Links have hover states

---

## Step 10: Run Tests

Create a basic test in `tests/components/layout/Navbar.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { Navbar } from '../../../src/components/layout/Navbar';
import { NavLink } from '../../../src/types/layout';

describe('Navbar', () => {
  const links: NavLink[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
  ];

  it('renders all navigation links', () => {
    render(<Navbar links={links} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders mobile menu button on mobile', () => {
    render(<Navbar links={links} />);
    
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });
});
```

Run tests:

```bash
npm test
```

---

## Troubleshooting

### Issue: Tailwind classes not applying

**Solution**: Ensure `tailwind.config.js` content paths include all your component files:
```javascript
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

### Issue: Colors notworking

**Solution**: Check that `src/index.css` includes Tailwind directives and is imported in `main.tsx`:
```typescript
import './index.css'
```

### Issue: Mobile menu not toggling

**Solution**: Ensure React state is set up correctly in Navbar component and button has onClick handler.

---

## Next Steps

1. **Add more pages**: Create additional routes with React Router
2. **Enhance accessibility**: Add ARIA labels and improve keyboard navigation
3. **Add animations**: Use Tailwind transitions for smoother interactions
4. **E2E tests**: Set up Playwright for visual regression testing
5. **Performance testing**: Measure load times with Lighthouse

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)

---

## Support

For questions or issues:
1. Check [research.md](../research.md) for design decisions
2. Review [data-model.md](../data-model.md) for component architecture
3. See [contracts/component-interfaces.md](../contracts/component-interfaces.md) for type definitions
4. Consult [spec.md](../spec.md) for requirements
