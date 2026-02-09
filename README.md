# Ziber Systems - Dark Mode UI

A modern React application featuring a professionally designed dark-themed interface with responsive two-column layout and orange accent colors.

## Features

- ✨ **Dark Theme**: WCAG AA compliant dark color scheme with excellent contrast ratios
- 📱 **Responsive Design**: Mobile-first two-column layout that stacks on mobile devices
- 🎨 **Orange Accents**: Vibrant orange (#FF6B35) accent color for interactive elements
- ♿ **Accessible**: Keyboard navigation, focus states, and screen reader support
- ⚡ **Fast**: Built with Vite for lightning-fast development and optimized production builds
- 🎯 **TypeScript**: Full type safety across all components

## Tech Stack

- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first styling
- **Vitest** - Testing framework

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Component Usage

### Navbar

```tsx
import { Navbar } from './components/layout';
import { NavLink } from './types/layout';

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
];

<Navbar links={navLinks} logo={<YourLogo />} />
```

### Two-Column Layout

```tsx
import { TwoColumnLayout, Column } from './components/layout';

<TwoColumnLayout
  leftColumn={
    <Column spacing="lg" border>
      <h2>Left Content</h2>
    </Column>
  }
  rightColumn={
    <Column spacing="lg" border>
      <h2>Right Content</h2>
    </Column>
  }
  gap="lg"
  columnRatio="1:1"
/>
```

### Button

```tsx
import { Button } from './components/layout';

<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
```

## Color Palette

```javascript
colors: {
  dark: {
    bg: '#0f0f0f',        // Main background
    surface: '#1a1a1a',   // Elevated surfaces
    border: '#2a2a2a',    // Borders
  },
  orange: {
    accent: '#FF6B35',    // Primary accent
    hover: '#FF8B5A',     // Hover states
    active: '#E55525',    // Active states
  },
  text: {
    primary: '#f5f5f5',   // Main text
    secondary: '#a0a0a0', // Secondary text
    muted: '#6b6b6b',     // Muted text
  },
}
```

## Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Navbar.tsx           # Navigation bar
│       ├── TwoColumnLayout.tsx  # Two-column layout
│       ├── Column.tsx           # Column wrapper
│       ├── Button.tsx           # Button component
│       └── index.ts             # Barrel exports
├── types/
│   └── layout.ts                # TypeScript interfaces
├── utils/
│   └── constants.ts             # Theme constants
├── App.tsx                      # Main app
└── main.tsx                     # Entry point
```

## Accessibility

- All text meets WCAG AA contrast ratios (4.5:1 minimum)
- Keyboard navigation fully supported
- Focus indicators with orange accent rings
- ARIA labels on interactive elements
- Responsive design supports 320px-2560px viewports

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Documentation

For detailed implementation guides, see:
- [Quickstart Guide](./specs/001-dark-ui-layout/quickstart.md)
- [Component Interfaces](./specs/001-dark-ui-layout/contracts/component-interfaces.md)
- [Data Model](./specs/001-dark-ui-layout/data-model.md)

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
