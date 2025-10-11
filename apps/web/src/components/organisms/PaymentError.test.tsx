import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentError } from './PaymentError';

describe('PaymentError', () => {
  describe('missing_recipient error type', () => {
    it('renders error message correctly', () => {
      render(
        <PaymentError
          errorType="missing_recipient"
          message="This payment link is incomplete. Contact the creator for a valid link."
        />
      );

      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });

    it('displays appropriate help text for missing recipient', () => {
      render(
        <PaymentError
          errorType="missing_recipient"
          message="This payment link is incomplete. Contact the creator for a valid link."
        />
      );

      expect(
        screen.getByText(
          'Double-check the link or contact the creator for a valid payment link.'
        )
      ).toBeInTheDocument();
    });

    it('has proper ARIA alert role', () => {
      render(
        <PaymentError
          errorType="missing_recipient"
          message="Test error message"
        />
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('displays AlertCircle icon', () => {
      const { container } = render(
        <PaymentError
          errorType="missing_recipient"
          message="Test error message"
        />
      );

      // Lucide icons render as SVG elements
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('displays "Back to home" button with correct link', () => {
      render(
        <PaymentError
          errorType="missing_recipient"
          message="Test error message"
        />
      );

      const backButton = screen.getByRole('link', { name: /back to home/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('href', '/');
    });
  });

  describe('invalid_address error type', () => {
    it('renders error message correctly', () => {
      render(
        <PaymentError
          errorType="invalid_address"
          message="Invalid payment link. Please check the URL and try again."
        />
      );

      expect(
        screen.getByText(
          'Invalid payment link. Please check the URL and try again.'
        )
      ).toBeInTheDocument();
    });

    it('displays appropriate help text for invalid address', () => {
      render(
        <PaymentError
          errorType="invalid_address"
          message="Invalid payment link. Please check the URL and try again."
        />
      );

      expect(
        screen.getByText(
          'Please verify the URL is correct and try again, or contact the creator.'
        )
      ).toBeInTheDocument();
    });

    it('has proper ARIA alert role', () => {
      render(
        <PaymentError
          errorType="invalid_address"
          message="Test error message"
        />
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('displays "Back to home" button with correct link', () => {
      render(
        <PaymentError
          errorType="invalid_address"
          message="Test error message"
        />
      );

      const backButton = screen.getByRole('link', { name: /back to home/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveAttribute('href', '/');
    });
  });

  describe('accessibility', () => {
    it('has 44px minimum touch target for button', () => {
      const { container } = render(
        <PaymentError errorType="invalid_address" message="Test error message" />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('uses semantic HTML structure', () => {
      render(
        <PaymentError errorType="invalid_address" message="Test error message" />
      );

      // Main element for page structure
      expect(screen.getByRole('main')).toBeInTheDocument();

      // H2 for error heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });
});
