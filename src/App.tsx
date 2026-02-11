import { TwoColumnLayout, Column, Button } from './components/layout';

function App() {
  return (
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
  );
}

export default App;
