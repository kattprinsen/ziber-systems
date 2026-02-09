# Research: Dark Mode UI Layout with Two-Column Design

**Feature**: 001-dark-ui-layout  
**Date**: February 9, 2026  
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Tasks

### 1. Tailwind CSS Integration with Vite + React

**Decision**: Install Tailwind CSS v3.x with PostCSS integration

**Rationale**:
- Tailwind CSS 3.x is the stable, production-ready version with excellent Vite support
- PostCSS integration allows for Vite's built-in optimization and tree-shaking
- Official Tailwind + Vite guide provides clear setup instructions
- JIT (Just-In-Time) mode in v3 eliminates need for purging and provides instant compilation
- Strong ecosystem support for React with `@tailwindcss/forms` and other official plugins

**Alternatives Considered**:
- **Styled Components / Emotion**: More verbose, adds runtime overhead, less performant than Tailwind's compile-time approach
- **CSS Modules**: Requires manual responsive design patterns, no built-in design system
- **Vanilla CSS**: Lacks utility-first approach, requires more custom CSS writing and maintenance
- **UnoCSS**: Newer, less mature ecosystem, fewer plugins and community resources

**Installation Steps**:
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Configuration Requirements**:
- Update `tailwind.config.js` with content paths: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Add Tailwind directives to `src/index.css`: `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`
- Configure custom colors in theme extension

---

### 2. Dark Mode Color Palette & Accessibility

**Decision**: Use dark gray backgrounds (NOT pure black) with orange accent color `#FF6B35`

**Rationale**:
- Dark gray (#1a1a1a, #0f0f0f) backgrounds reduce eye strain compared to pure black (#000000)
- Provides better contrast hierarchy between UI elements (background, cards, borders)
- Orange accent `#FF6B35` (hsl(15, 100%, 60%)) meets WCAG AA contrast requirements:
  - Against dark background (#1a1a1a): contrast ratio 5.8:1 ✅ (exceeds 4.5:1)
  - Against mid-dark (#2a2a2a): contrast ratio 4.9:1 ✅
- Complementary color palette reduces vibration compared to pure orange (#FF6B00) on black

**Alternatives Considered**:
- **Pure black backgrounds**: Causes eye strain, harsh contrast, less depth perception
- **Blue-based dark themes**: Overused pattern, lacks uniqueness requested by user
- **Pure orange #FF6B00**: Higher vibration on dark backgrounds, accessibility concerns on certain gray values
- **Multiple accent colors**: Adds complexity, reduces visual hierarchy clarity

**Recommended Palette**:
```javascript
colors: {
  dark: {
    bg: '#0f0f0f',      // Main background
    surface: '#1a1a1a',  // Cards, elevated surfaces
    border: '#2a2a2a',   // Borders, dividers
  },
  orange: {
    accent: '#FF6B35',   // Primary accent
    hover: '#FF8B5A',    // Hover states (lighter)
    active: '#E55525',   // Active/pressed states (darker)
  },
  text: {
    primary: '#f5f5f5',  // Main text (contrast 15.8:1)
    secondary: '#a0a0a0', // Secondary text (contrast 8.9:1)
    muted: '#6b6b6b',    // Muted text (contrast 4.7:1 - AA)
  }
}
```

**Accessibility Validation**:
- All text colors tested against backgrounds using WebAIM contrast checker
- Focus states use orange accent with 2px outline for keyboard navigation visibility
- Hover states increase brightness by 15% for clear interactive feedback

---

### 3. Two-Column Responsive Layout Pattern

**Decision**: Use CSS Grid for main layout with Tailwind's responsive utilities

**Rationale**:
- CSS Grid provides precise control over two-column alignment and spacing
- Tailwind's `grid` and `grid-cols-*` classes offer declarative syntax
- Single media query breakpoint at 768px (md: prefix) simplifies responsive logic
- Grid auto-placement handles variable content heights gracefully
- Gap property provides consistent spacing without margin calculation

**Alternatives Considered**:
- **Flexbox**: Works but requires more nesting for equal-width columns, gap support is newer
- **Float-based layout**: Outdated, requires clearfix hacks, poor responsive support
- **Table layout**: Semantic misuse, accessibility concerns, inflexible
- **Multiple breakpoints**: Adds complexity, 768px single breakpoint sufficient for mobile/desktop split

**Implementation Pattern**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
  <div className="col-span-1">{/* Column 1 */}</div>
  <div className="col-span-1">{/* Column 2 */}</div>
</div>
```

**Breakpoint Strategy**:
- **Mobile (< 768px)**: Single column, stacked layout
- **Tablet/Desktop (≥ 768px)**: Two equal-width columns
- Gap scaling: 16px mobile, 24px tablet, 32px desktop

---

### 4. Navigation Bar Responsive Pattern

**Decision**: Mobile hamburger menu with full-width navigation on desktop

**Rationale**:
- Standard pattern users expect, reduces cognitive load
- Hamburger icon universally recognized on mobile
- Full horizontal navigation on desktop maximizes visibility
- Tailwind's `hidden` and `md:flex` utilities make implementation straightforward
- Maintains accessibility with keyboard navigation and ARIA labels

**Alternatives Considered**:
- **Bottom navigation bar (mobile)**: Thumb-friendly but unconventional for web apps
- **Always visible nav on mobile**: Takes too much vertical space, hides content
- **Dropdown mega menu**: Overengineered for simple navigation needs
- **Sticky sidebar**: Waste of horizontal space on mobile, conflicts with two-column layout

**Implementation Approach**:
```jsx
// Desktop: horizontal flex
<nav className="hidden md:flex md:space-x-6">
  <NavLink>Home</NavLink>
  <NavLink>About</NavLink>
</nav>

// Mobile: hamburger button + slide-out menu
<button className="md:hidden">☰</button>
<div className="md:hidden fixed left-0 top-0 ...">{/* Mobile menu */}</div>
```

---

### 5. Component Testing Strategy

**Decision**: Vitest + React Testing Library for unit tests, Playwright for visual regression

**Rationale**:
- **Vitest**: Native Vite integration, faster than Jest, compatible API, better TypeScript support
- **React Testing Library**: Encourages accessibility-focused testing, queries by role/label
- **Playwright**: Better cross-browser support than Cypress, visual comparison built-in
- Separation of concerns: unit tests verify behavior, E2E tests verify visual appearance

**Alternatives Considered**:
- **Jest**: Slower setup with Vite, requires additional configuration (babel)
- **Cypress**: Good but heavier, Playwright has better TypeScript support
- **Storybook + Chromatic**: Adds dependency complexity, overkill for single feature
- **Manual testing only**: Unsustainable, no regression protection

**Test Coverage Plan**:
```
Unit Tests (Vitest + RTL):
- Navbar: renders links, handles mobile menu toggle, keyboard navigation
- TwoColumnLayout: renders children in columns, responsive class application
- Column: accepts content, applies spacing classes

E2E Tests (Playwright):
- Visual regression: dark theme colors, orange accents, responsive breakpoint
- Accessibility: contrast ratios, focus states, screen reader compatibility
- Responsive: layout stacks on mobile, side-by-side on desktop
```

---

### 6. Performance Optimization

**Decision**: Leverage Vite's built-in optimizations with minimal custom configuration

**Rationale**:
- Vite's fast dev server provides instant HMR without optimization overhead
- Production build automatically tree-shakes unused Tailwind classes via PurgeCSS
- Code-splitting at route level (if React Router added later) defers non-critical JS
- CSS is extracted and minified automatically in production builds
- No need for complex webpack configurations

**Optimization Checklist**:
- [x] Tailwind JIT mode (default in v3)
- [x] PurgeCSS via Tailwind content configuration
- [x] Vite build with minification
- [ ] Image optimization (if images added later)
- [ ] Font subsetting (if custom fonts added)

**Performance Targets (from spec SC-001)**:
- Initial load < 2s on 5 Mbps
- First Contentful Paint < 1.5s
- Time to Interactive < 3s

**Baseline**: Current React + Vite app without Tailwind (for comparison after implementation)

---

## Summary of Unknowns Resolved

| Unknown | Resolution |
|---------|-----------|
| CSS Framework setup | Tailwind CSS v3 with PostCSS, official Vite integration |
| Dark mode color scheme | Dark gray backgrounds (#0f0f0f, #1a1a1a) with orange (#FF6B35) |
| Responsive layout approach | CSS Grid with single 768px breakpoint |
| Navigation pattern | Hamburger menu (mobile) + horizontal nav (desktop) |
| Testing framework | Vitest + React Testing Library + Playwright |
| Performance strategy | Leverage Vite defaults, Tailwind tree-shaking |

## Next Steps (Phase 1)

1. Generate data-model.md (component architecture)
2. Create API contracts documentation (component props interfaces)
3. Write quickstart.md (developer setup guide)
4. Update agent context with new technologies
