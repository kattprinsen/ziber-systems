import { Navbar, TwoColumnLayout, Column, Button } from './components/layout';
import type { NavLink } from './types/layout';

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
                The two-column layout displays side-by-side on desktop (≥768px)
                and stacks vertically on mobile devices.
              </p>
              <div className="space-y-4">
                <Button variant="primary">
                  Primary Action
                </Button>
                <Button variant="secondary" className="block">
                  Secondary Action
                </Button>
              </div>
            </Column>
          }
          rightColumn={
            <Column spacing="lg" border>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Right Column
              </h2>
              <p className="text-text-secondary mb-6">
                This is the right column content. Both columns have equal width
                on desktop and maintain proper spacing (24px gap by default).
              </p>
              <ul className="space-y-2 text-text-secondary">
                <li className="flex items-center">
                  <span className="text-orange-accent mr-2">✓</span>
                  Dark theme with WCAG AA contrast
                </li>
                <li className="flex items-center">
                  <span className="text-orange-accent mr-2">✓</span>
                  Responsive two-column layout
                </li>
                <li className="flex items-center">
                  <span className="text-orange-accent mr-2">✓</span>
                  Orange accent colors
                </li>
              </ul>
            </Column>
          }
          gap="lg"
        />
      </main>
    </div>
  );
}

export default App;
