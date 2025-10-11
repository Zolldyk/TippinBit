import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail, Search } from 'lucide-react';
import { Input } from './Input';

describe('Input', () => {
  describe('Basic Rendering', () => {
    it('renders input field correctly', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', input.id);
    });

    it('associates label with input via htmlFor', () => {
      render(<Input label="Email" id="email-input" />);
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email-input');
    });
  });

  describe('Validation States', () => {
    it('renders default state correctly', () => {
      render(<Input validationState="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-[var(--color-neutral-200)]');
    });

    it('renders error state with message', () => {
      render(
        <Input
          validationState="error"
          errorMessage="This field is required"
        />
      );
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('This field is required');

      expect(input).toHaveClass('border-[var(--color-error)]');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });

    it('renders success state with message', () => {
      render(
        <Input
          validationState="success"
          successMessage="Valid input"
        />
      );
      const input = screen.getByRole('textbox');
      const successMessage = screen.getByText('Valid input');

      expect(input).toHaveClass('border-[var(--color-success)]');
      expect(successMessage).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('renders with leading icon', () => {
      render(<Input leadingIcon={Mail} />);
      const input = screen.getByRole('textbox');
      const icon = input.parentElement?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders with trailing icon', () => {
      render(<Input trailingIcon={Search} />);
      const input = screen.getByRole('textbox');
      const icon = input.parentElement?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('shows error icon in error state', () => {
      render(
        <Input validationState="error" errorMessage="Error" />
      );
      const input = screen.getByRole('textbox');
      const icons = input.parentElement?.querySelectorAll('svg');
      // Should have error icon
      expect(icons?.length).toBeGreaterThan(0);
    });

    it('shows success icon in success state', () => {
      render(
        <Input validationState="success" successMessage="Success" />
      );
      const input = screen.getByRole('textbox');
      const icons = input.parentElement?.querySelectorAll('svg');
      // Should have success icon
      expect(icons?.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error state', () => {
      render(
        <Input
          validationState="error"
          errorMessage="Error message"
          id="test-input"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });

    it('has proper ARIA attributes for success state', () => {
      render(
        <Input
          validationState="success"
          successMessage="Success message"
          id="test-input"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-success');
    });

    it('has minimum 44px height', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input correctly', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('cannot be focused when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(input).not.toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('accepts text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });

    it('calls onChange handler', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'a');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(<Input className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
