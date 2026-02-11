import { useState } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import type { NavLink } from '../../types/layout';

const navLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Users', href: '/users' },
  { label: 'Tools', href: '/tools' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logo = null; // Replace with actual logo component or image if available
  return (
    <nav className={`bg-dark-surface border-b border-dark-border`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logo || <span className="text-xl font-bold text-orange-accent">Logo</span>}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            {navLinks.map((link, index) => (
              <RouterNavLink
                key={index}
                to={link.href}
                className={({ isActive }) => 
                  `text-text-secondary hover:text-orange-accent transition-colors duration-200 focus-orange ${
                    isActive ? 'text-orange-accent' : ''
                  }`
                }
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </RouterNavLink>
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
            {navLinks.map((link, index) => (
              <RouterNavLink
                key={index}
                to={link.href}
                className={({ isActive }) => 
                  `block px-3 py-2 text-text-secondary hover:text-orange-accent hover:bg-dark-surface rounded-md transition-colors duration-200 ${
                    isActive ? 'text-orange-accent' : ''
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </RouterNavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
