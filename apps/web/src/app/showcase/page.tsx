/**
 * Design System Showcase Page
 *
 * Displays all atomic components with variants and states
 * for design system documentation and testing
 */

'use client';

import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Mail, Search } from 'lucide-react';

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-h1 font-bold text-[var(--color-neutral-charcoal)] mb-2">
            Design System Showcase
          </h1>
          <p className="text-body text-[var(--color-neutral-600)]">
            TippinBit component library - Sharp, clean, accessible
          </p>
        </header>

        {/* Color Palette Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Color Palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Primary Colors */}
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-coral)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Coral</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #FF7A59
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-coral-dark)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Coral Dark</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #E85D3C
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-teal)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Teal</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #14B8A6
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-bitcoin)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Bitcoin</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #FBBF24
              </p>
            </div>

            {/* Status Colors */}
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-success)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Success</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #10B981
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-warning)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Warning</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #FBBF24
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-error)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Error</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #F87171
              </p>
            </div>

            {/* Neutral Colors */}
            <div className="space-y-2">
              <div className="h-24 rounded-card bg-[var(--color-neutral-charcoal)] border border-[var(--color-neutral-200)]" />
              <p className="text-small font-medium">Charcoal</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                #18181B
              </p>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Typography Scale
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-h1 font-bold">Heading 1</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                32px / 700 / -0.02em
              </p>
            </div>
            <div>
              <p className="text-h2 font-semibold">Heading 2</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                24px / 600 / -0.01em
              </p>
            </div>
            <div>
              <p className="text-h3 font-semibold">Heading 3</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                20px / 600 / 0
              </p>
            </div>
            <div>
              <p className="text-body-lg">Body Large</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                18px / 400 / 0
              </p>
            </div>
            <div>
              <p className="text-body">Body Standard</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                16px / 400 / 0
              </p>
            </div>
            <div>
              <p className="text-small">Small Text</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                14px / 400 / 0
              </p>
            </div>
            <div>
              <p className="text-caption">Caption Text</p>
              <p className="text-caption text-[var(--color-neutral-600)]">
                12px / 500 / 0.01em
              </p>
            </div>
          </div>
        </section>

        {/* Button Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Button Component
          </h2>

          <div className="space-y-8">
            {/* Primary Variant */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Primary Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Default</Button>
                <Button variant="primary" loading>
                  Loading
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Secondary Variant */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Secondary Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary">Default</Button>
                <Button variant="secondary" loading>
                  Loading
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Tertiary Variant */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Tertiary Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="tertiary">Default</Button>
                <Button variant="tertiary" loading>
                  Loading
                </Button>
                <Button variant="tertiary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Code Example */}
            <div className="bg-[var(--color-neutral-warm-white)] p-4 rounded-card border border-[var(--color-neutral-200)]">
              <p className="text-small font-medium mb-2">Usage Example:</p>
              <code className="text-caption font-mono text-[var(--color-neutral-600)]">
                {`<Button variant="primary">Click me</Button>`}
                <br />
                {`<Button variant="secondary" loading>Loading...</Button>`}
                <br />
                {`<Button variant="tertiary" disabled>Disabled</Button>`}
              </code>
            </div>
          </div>
        </section>

        {/* Input Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Input Component
          </h2>

          <div className="space-y-8 max-w-md">
            {/* Default State */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Default State</h3>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
              />
            </div>

            {/* With Icons */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">With Icons</h3>
              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="Search..."
                  leadingIcon={Mail}
                />
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search..."
                  trailingIcon={Search}
                />
              </div>
            </div>

            {/* Error State */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Error State</h3>
              <Input
                label="Username"
                type="text"
                placeholder="Enter username"
                validationState="error"
                errorMessage="This username is already taken"
              />
            </div>

            {/* Success State */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Success State</h3>
              <Input
                label="Amount"
                type="number"
                placeholder="0.00"
                validationState="success"
                successMessage="Valid amount entered"
              />
            </div>

            {/* Disabled State */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Disabled State</h3>
              <Input
                label="Disabled field"
                type="text"
                placeholder="Cannot edit"
                disabled
              />
            </div>

            {/* Code Example */}
            <div className="bg-[var(--color-neutral-warm-white)] p-4 rounded-card border border-[var(--color-neutral-200)]">
              <p className="text-small font-medium mb-2">Usage Example:</p>
              <code className="text-caption font-mono text-[var(--color-neutral-600)]">
                {`<Input label="Email" type="email" />`}
                <br />
                {`<Input validationState="error" errorMessage="Error text" />`}
                <br />
                {`<Input leadingIcon={Mail} trailingIcon={Search} />`}
              </code>
            </div>
          </div>
        </section>

        {/* Card Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Card Component
          </h2>

          <div className="space-y-8">
            {/* Base Variant */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Base Variant</h3>
              <Card variant="base">
                <p className="text-body">
                  This is a base card with warm white background and subtle
                  border. Perfect for content that needs gentle separation from
                  the page background.
                </p>
              </Card>
            </div>

            {/* Elevated Variant */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">Elevated Variant</h3>
              <Card variant="elevated">
                <p className="text-body">
                  This is an elevated card with shadow and no border. Use for
                  content that needs more visual prominence.
                </p>
              </Card>
            </div>

            {/* With Header and Footer */}
            <div>
              <h3 className="text-h3 font-semibold mb-4">
                With Header and Footer
              </h3>
              <Card
                variant="base"
                header={
                  <h3 className="text-h3 font-semibold">Card Title</h3>
                }
                footer={
                  <div className="flex gap-2">
                    <Button variant="primary">Confirm</Button>
                    <Button variant="secondary">Cancel</Button>
                  </div>
                }
              >
                <p className="text-body">
                  Card body content goes here. The header and footer are
                  automatically separated with dividers.
                </p>
              </Card>
            </div>

            {/* Code Example */}
            <div className="bg-[var(--color-neutral-warm-white)] p-4 rounded-card border border-[var(--color-neutral-200)]">
              <p className="text-small font-medium mb-2">Usage Example:</p>
              <code className="text-caption font-mono text-[var(--color-neutral-600)]">
                {`<Card variant="base">Content</Card>`}
                <br />
                {`<Card variant="elevated">Content</Card>`}
                <br />
                {`<Card header={<h3>Title</h3>} footer={<Button />}>`}
                <br />
                {`  Content`}
                <br />
                {`</Card>`}
              </code>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="mb-16">
          <h2 className="text-h2 font-semibold text-[var(--color-neutral-charcoal)] mb-6">
            Accessibility Features
          </h2>
          <Card variant="base">
            <ul className="space-y-2 text-body">
              <li>✓ All components meet 44px minimum touch target size</li>
              <li>✓ WCAG 2.1 AA contrast requirements (4.5:1 minimum)</li>
              <li>✓ Keyboard navigation support with visible focus indicators</li>
              <li>✓ ARIA labels for loading and disabled states</li>
              <li>✓ Error messages linked via aria-describedby</li>
              <li>✓ Screen reader compatible with proper semantic HTML</li>
              <li>✓ Reduced motion support for loading animations</li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
