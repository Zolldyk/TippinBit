import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsernameClaimForm } from './UsernameClaimForm';

// Mock hooks
const mockUseUsernameAvailability = vi.fn();
const mockClaimUsername = vi.fn();
const mockUseUsernameClaim = vi.fn();

vi.mock('@/hooks/useUsernameAvailability', () => ({
  useUsernameAvailability: () => mockUseUsernameAvailability(),
}));

vi.mock('@/hooks/useUsernameClaim', () => ({
  useUsernameClaim: () => mockUseUsernameClaim(),
}));

describe('UsernameClaimForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock values
    mockUseUsernameAvailability.mockReturnValue({
      status: 'idle',
    });

    mockUseUsernameClaim.mockReturnValue({
      claimUsername: mockClaimUsername,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      reset: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('renders username input with placeholder "@yourname"', () => {
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders claim button', () => {
      render(<UsernameClaimForm />);

      const button = screen.getByRole('button', { name: /claim username/i });
      expect(button).toBeInTheDocument();
    });

    it('renders helper text about payment link', () => {
      render(<UsernameClaimForm />);

      expect(
        screen.getByText(/your username will be linked to your wallet/i)
      ).toBeInTheDocument();
    });
  });

  describe('Username Input', () => {
    it('automatically prepends @ when user types without it', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      expect(input).toHaveValue('@alice');
    });

    it('does not double @ prefix if user types it', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, '@alice');

      expect(input).toHaveValue('@alice');
    });

    it('shows validation error for username shorter than 3 characters', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'ab');

      await waitFor(() => {
        expect(
          screen.getByText(/username must be at least 3 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for username longer than 20 characters', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'thisusernameiswaytoolong');

      await waitFor(() => {
        expect(
          screen.getByText(/username must be at most 20 characters/i)
        ).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid characters', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice@bob');

      await waitFor(() => {
        expect(
          screen.getByText(/username can only contain letters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Availability Indicators', () => {
    it('shows green checkmark and "Available!" when username is available', async () => {
      const user = userEvent.setup();

      // Set mock to return 'available' status before rendering
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      const { rerender } = render(<UsernameClaimForm />);

      // Type a valid username (3+ chars) to trigger isValid = true
      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      // Force a re-render to ensure the component updates with both status='available' and isValid=true
      rerender(<UsernameClaimForm />);

      await waitFor(() => {
        expect(screen.getByText('Available!')).toBeInTheDocument();
      });

      // Check for Check icon (checkmark)
      const statusDiv = screen.getByRole('status');
      expect(statusDiv).toHaveTextContent('Available!');
    });

    it('shows red X and "Already taken" when username is taken', async () => {
      const user = userEvent.setup();

      // Set mock to return 'taken' status before rendering
      mockUseUsernameAvailability.mockReturnValue({
        status: 'taken',
      });

      const { rerender } = render(<UsernameClaimForm />);

      // Type a valid username
      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      // Force a re-render
      rerender(<UsernameClaimForm />);

      await waitFor(() => {
        expect(screen.getByText('Already taken')).toBeInTheDocument();
      });
    });

    it('shows spinner while checking availability', async () => {
      const user = userEvent.setup();

      // Set mock to return 'checking' status before rendering
      mockUseUsernameAvailability.mockReturnValue({
        status: 'checking',
      });

      const { rerender } = render(<UsernameClaimForm />);

      // Type a valid username
      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      // Force a re-render
      rerender(<UsernameClaimForm />);

      await waitFor(() => {
        const statusDiv = screen.getByRole('status');
        expect(statusDiv).toBeInTheDocument();
        // Spinner is present but hidden for screen readers
        expect(screen.getByText('Checking availability...')).toHaveClass(
          'sr-only'
        );
      });
    });

    it('shows "Unable to check" when status is unknown', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'unknown',
      });

      render(<UsernameClaimForm />);

      expect(screen.getByText('Unable to check')).toBeInTheDocument();
    });
  });

  describe('Username Suggestions', () => {
    it('displays suggestions when username is taken', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'taken',
      });

      render(<UsernameClaimForm />);

      // Suggestions should appear
      expect(screen.getByText('Try these instead:')).toBeInTheDocument();
    });

    it('clicking suggestion updates input field', async () => {
      const user = userEvent.setup();
      mockUseUsernameAvailability.mockReturnValue({
        status: 'taken',
      });

      render(<UsernameClaimForm />);

      // Suggestions are generated based on input, so we need to type first
      const input = screen.getByPlaceholderText('@yourname');
      await user.clear(input);
      await user.type(input, 'alice');

      await waitFor(() => {
        expect(screen.getByText('@alice2')).toBeInTheDocument();
      });

      // Click a suggestion
      await user.click(screen.getByText('@alice2'));

      expect(input).toHaveValue('@alice2');
    });

    it('does not show suggestions when username is available', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      render(<UsernameClaimForm />);

      expect(screen.queryByText('Try these instead:')).not.toBeInTheDocument();
    });
  });

  describe('Claim Button', () => {
    it('is disabled when username is invalid', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'idle',
      });

      render(<UsernameClaimForm />);

      const button = screen.getByRole('button', { name: /claim username/i });
      expect(button).toBeDisabled();
    });

    it('is disabled when username is taken', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'taken',
      });

      render(<UsernameClaimForm />);

      const button = screen.getByRole('button', { name: /claim/i });
      expect(button).toBeDisabled();
    });

    it('is disabled when checking availability', () => {
      mockUseUsernameAvailability.mockReturnValue({
        status: 'checking',
      });

      render(<UsernameClaimForm />);

      const button = screen.getByRole('button', { name: /claim/i });
      expect(button).toBeDisabled();
    });

    it('is enabled when username is valid and available', async () => {
      const user = userEvent.setup();
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /claim @alice/i });
        expect(button).toBeEnabled();
      });
    });

    it('shows username in button text when entered', async () => {
      const user = userEvent.setup();
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      await waitFor(() => {
        expect(screen.getByText('Claim @alice')).toBeInTheDocument();
      });
    });

    it('shows "Claiming..." text when pending', () => {
      mockUseUsernameClaim.mockReturnValue({
        claimUsername: mockClaimUsername,
        isPending: true,
        isSuccess: false,
        isError: false,
        error: null,
        data: null,
        reset: vi.fn(),
      });

      render(<UsernameClaimForm />);

      expect(screen.getByText('Claiming...')).toBeInTheDocument();
    });

    it('calls claimUsername with correct username when clicked', async () => {
      const user = userEvent.setup();
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'alice');

      const button = screen.getByRole('button', { name: /claim @alice/i });
      await user.click(button);

      expect(mockClaimUsername).toHaveBeenCalledWith({ username: 'alice' });
    });

    it('removes @ prefix before calling claim API', async () => {
      const user = userEvent.setup();
      mockUseUsernameAvailability.mockReturnValue({
        status: 'available',
      });

      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, '@alice');

      const button = screen.getByRole('button', { name: /claim @alice/i });
      await user.click(button);

      expect(mockClaimUsername).toHaveBeenCalledWith({ username: 'alice' });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('has minimum 44px touch target on claim button', () => {
      render(<UsernameClaimForm />);

      const button = screen.getByRole('button', { name: /claim/i });
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('renders full-width input', () => {
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      expect(input.parentElement).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes on input', () => {
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      expect(input).toHaveAttribute('aria-describedby', 'availability-status');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    it('sets aria-invalid when validation error exists', async () => {
      const user = userEvent.setup();
      render(<UsernameClaimForm />);

      const input = screen.getByPlaceholderText('@yourname');
      await user.type(input, 'ab');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('has live region for availability status', () => {
      render(<UsernameClaimForm />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('has accessible label for input', () => {
      render(<UsernameClaimForm />);

      const label = screen.getByText('Choose your username');
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute('for', 'username-input');
    });
  });

  describe('Success State', () => {
    it('shows success component when claim succeeds', () => {
      mockUseUsernameClaim.mockReturnValue({
        claimUsername: mockClaimUsername,
        isPending: false,
        isSuccess: true,
        isError: false,
        error: null,
        data: {
          success: true,
          username: 'alice',
          walletAddress: '0x123...',
        },
        reset: vi.fn(),
      });

      render(<UsernameClaimForm />);

      expect(screen.getByText('✓ @alice claimed!')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error component when claim fails', () => {
      mockUseUsernameClaim.mockReturnValue({
        claimUsername: mockClaimUsername,
        isPending: false,
        isSuccess: false,
        isError: true,
        error: {
          message: 'Someone just claimed this username. Try another.',
          code: 'USERNAME_TAKEN',
        },
        data: null,
        reset: vi.fn(),
      });

      render(<UsernameClaimForm />);

      expect(screen.getByText('Claim Failed')).toBeInTheDocument();
    });
  });
});
