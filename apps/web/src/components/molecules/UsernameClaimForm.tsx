'use client';

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { useUsernameClaim } from '@/hooks/useUsernameClaim';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { UsernameClaimSuccess } from './UsernameClaimSuccess';
import { UsernameClaimError } from './UsernameClaimError';
import { MessagePreview } from './MessagePreview';
import {
  validateUsername,
  normalizeUsername,
  generateUsernameSuggestions,
  validateMessageLength,
} from '@/lib/validation';

/**
 * Username Claim Form
 *
 * Form for claiming a @username with real-time availability checking.
 *
 * Features:
 * - Real-time availability check with 500ms debounce
 * - Validation indicators (green checkmark, red X, spinner)
 * - Username suggestions when taken
 * - Wallet signature integration
 * - Success/error state handling
 * - Mobile-optimized with 44px touch targets
 *
 * @example
 * ```typescript
 * <UsernameClaimForm />
 * ```
 */
export function UsernameClaimForm() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState<string>('');
  const { status } = useUsernameAvailability(username);
  const { claimUsername, isPending, isSuccess, isError, error, data, reset } =
    useUsernameClaim();

  // Validate username format
  const validationError = username.length >= 3 ? validateUsername(username) : null;
  const isValid = validationError === null && username.length >= 3;

  // Validate message length
  const messageValidation = validateMessageLength(message);
  const isMessageValid = messageValidation.isValid;

  // Character count for display
  const charactersRemaining = 200 - message.length;

  // Determine if claim button should be enabled
  const canClaim = isValid && status === 'available' && !isPending && isMessageValid;

  // Generate suggestions if username is taken
  const suggestions =
    status === 'taken' ? generateUsernameSuggestions(username) : [];

  // Handle username input change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Ensure @ prefix
    if (!value.startsWith('@')) {
      value = '@' + value;
    }

    setUsername(value);
  };

  // Handle claim button click
  const handleClaim = () => {
    if (!canClaim) return;

    const cleanUsername = username.replace(/^@/, '');
    claimUsername({
      username: cleanUsername,
      ...(message && isMessageValid && { thankyouMessage: message }),
    });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
  };

  // Handle try another username (reset from error state)
  const handleTryAnother = () => {
    reset();
    setUsername('');
  };

  // Show success state
  if (isSuccess && data) {
    return (
      <UsernameClaimSuccess
        username={normalizeUsername(data.username)}
        onCreateAnother={handleTryAnother}
      />
    );
  }

  // Show error state
  if (isError && error) {
    return (
      <UsernameClaimError error={error} onTryAnother={handleTryAnother} />
    );
  }

  // Main form
  return (
    <div className="space-y-4">
      {/* Username Input */}
      <div>
        <label
          htmlFor="username-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Choose your username
        </label>

        <div className="relative">
          <Input
            id="username-input"
            type="text"
            placeholder="@yourname"
            value={username}
            onChange={handleUsernameChange}
            validationState={
              validationError
                ? 'error'
                : status === 'available'
                  ? 'success'
                  : 'default'
            }
            {...(validationError ? { errorMessage: validationError } : {})}
            aria-describedby="availability-status"
            aria-invalid={validationError ? 'true' : 'false'}
            disabled={isPending}
            className="w-full"
          />

          {/* Availability Indicator */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"
            id="availability-status"
            role="status"
            aria-live="polite"
          >
            {status === 'checking' && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="sr-only">Checking availability...</span>
              </div>
            )}

            {status === 'available' && isValid && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-5 h-5" aria-label="Available" />
                <span className="font-medium">Available!</span>
              </div>
            )}

            {status === 'taken' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <X className="w-5 h-5" aria-label="Taken" />
                <span className="font-medium">Already taken</span>
              </div>
            )}

            {status === 'unknown' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <X className="w-4 h-4" aria-label="Unknown" />
                <span className="text-xs">Unable to check</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Thank-you Message Input (AC1, AC2, AC3, AC4, AC13) */}
      <div className="space-y-2">
        <label
          htmlFor="thankyou-message-username"
          className="block text-sm font-medium text-gray-700"
        >
          Thank-you message (optional)
        </label>
        <textarea
          id="thankyou-message-username"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional: Add a personal message (e.g., 'Thank you for the coffee! ❤️')"
          maxLength={200}
          rows={3}
          className="w-full resize-none overflow-y-auto px-4 py-3 text-base
            border border-gray-300 rounded-lg
            focus:border-coral focus:ring-2 focus:ring-coral focus:outline-none
            min-h-[80px] max-h-[200px]"
          aria-describedby="char-counter-username message-validation-error-username"
          aria-label="Thank-you message (optional)"
          disabled={isPending}
        />

        {/* Character Counter (AC3, AC13) */}
        <div
          id="char-counter-username"
          className="text-sm text-gray-600"
          aria-live="polite"
          aria-atomic="true"
        >
          {charactersRemaining} characters remaining
        </div>

        {/* Validation Error (AC4, AC13) */}
        {!isMessageValid && (
          <div
            id="message-validation-error-username"
            className="text-sm text-red-600"
            role="alert"
            aria-live="assertive"
          >
            {messageValidation.error}
          </div>
        )}
      </div>

      {/* Message Preview (AC11) */}
      {username && message && (
        <MessagePreview
          message={message}
          creatorDisplayName={normalizeUsername(username)}
        />
      )}

      {/* Username Suggestions */}
      {status === 'taken' && suggestions.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Try these instead:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:border-coral hover:text-coral transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Claim Button */}
      <Button
        variant="primary"
        onClick={handleClaim}
        disabled={!canClaim}
        loading={isPending}
        className="w-full md:w-auto min-h-[44px]"
        aria-label={
          username
            ? `Claim ${normalizeUsername(username)}`
            : 'Claim username'
        }
      >
        {isPending
          ? 'Claiming...'
          : username
            ? `Claim ${normalizeUsername(username)}`
            : 'Claim Username'}
      </Button>

      {/* Helper Text */}
      <p className="text-sm text-gray-500">
        Your username will be linked to your wallet address and can be used to
        receive payments at{' '}
        <span className="font-mono">tippinbit.com/pay/@yourname</span>
      </p>
    </div>
  );
}
