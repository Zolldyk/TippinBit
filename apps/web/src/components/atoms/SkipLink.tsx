/**
 * Skip-to-main-content link for keyboard navigation
 *
 * Positioned visually hidden by default, becomes visible on focus.
 * Allows keyboard users to bypass navigation and jump directly to main content.
 *
 * Accessibility:
 * - Visually hidden until focused
 * - High z-index to appear above all content
 * - Clear focus indicator with coral ring
 * - Links to #main-content anchor
 */

'use client';

/**
 * SkipLink component
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <body>
 *   <SkipLink />
 *   <Header />
 *   <main id="main-content">...</main>
 * </body>
 * ```
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--color-coral)] focus:text-white focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-[var(--color-coral)] focus:ring-offset-2 focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
