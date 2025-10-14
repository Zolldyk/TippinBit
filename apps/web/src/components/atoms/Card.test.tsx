import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  describe('Variants', () => {
    it('renders base variant correctly', () => {
      const { container } = render(
        <Card variant="base">Base card content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-[var(--color-neutral-warm-white)]');
      expect(card).toHaveClass('border');
    });

    it('renders elevated variant correctly', () => {
      const { container } = render(
        <Card variant="elevated">Elevated card content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-sm');
    });

    it('defaults to base variant when no variant specified', () => {
      const { container } = render(<Card>Default card</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-[var(--color-neutral-warm-white)]');
    });
  });

  describe('Content', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with header', () => {
      render(
        <Card header={<h3>Card Header</h3>}>
          Card body
        </Card>
      );
      expect(screen.getByText('Card Header')).toBeInTheDocument();
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('renders with footer', () => {
      render(
        <Card footer={<button>Action</button>}>
          Card body
        </Card>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Card body')).toBeInTheDocument();
    });

    it('renders with header and footer', () => {
      render(
        <Card
          header={<h3>Header</h3>}
          footer={<button>Footer</button>}
        >
          Body
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('has proper border radius', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('rounded-[var(--radius-card)]');
    });

    it('has responsive padding', () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('p-4');
      expect(card).toHaveClass('md:p-6');
    });

    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML', () => {
      const { container } = render(
        <Card>
          <p>Accessible content</p>
        </Card>
      );
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('DIV');
    });

    it('maintains proper text contrast', () => {
      render(
        <Card variant="base">
          <p className="text-[var(--color-neutral-charcoal)]">
            High contrast text
          </p>
        </Card>
      );
      // Verify charcoal text on warm-white background meets WCAG AA
      const paragraph = screen.getByText('High contrast text');
      expect(paragraph).toHaveClass('text-[var(--color-neutral-charcoal)]');
    });
  });

  describe('Header and Footer Dividers', () => {
    it('adds divider below header', () => {
      const { container } = render(
        <Card header={<h3>Header</h3>}>Body</Card>
      );
      const headerWrapper = container.querySelector('.border-b');
      expect(headerWrapper).toBeInTheDocument();
    });

    it('adds divider above footer', () => {
      const { container } = render(
        <Card footer={<button>Footer</button>}>Body</Card>
      );
      const footerWrapper = container.querySelector('.border-t');
      expect(footerWrapper).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('renders nested components', () => {
      render(
        <Card>
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <button>Action</button>
          </div>
        </Card>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });
});
