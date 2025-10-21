import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessagePreview } from './MessagePreview';

describe('MessagePreview', () => {
  it('displays custom message with creator name', () => {
    render(
      <MessagePreview
        message="Thank you for the coffee!"
        creatorDisplayName="@alice"
      />
    );

    expect(screen.getByText('@alice says: Thank you for the coffee!')).toBeInTheDocument();
  });

  it('displays fallback message when no custom message', () => {
    render(
      <MessagePreview
        message=""
        creatorDisplayName="@alice"
      />
    );

    expect(screen.getByText('Thank you for your support! ❤️')).toBeInTheDocument();
  });

  it('sanitizes HTML tags in message', () => {
    render(
      <MessagePreview
        message="Hello <script>alert('XSS')</script>world!"
        creatorDisplayName="@alice"
      />
    );

    // Script tag should be stripped
    expect(screen.getByText('@alice says: Hello world!')).toBeInTheDocument();
    expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
  });

  it('preserves emoji in message', () => {
    render(
      <MessagePreview
        message="Thank you! ❤️🙏"
        creatorDisplayName="@alice"
      />
    );

    expect(screen.getByText('@alice says: Thank you! ❤️🙏')).toBeInTheDocument();
  });

  it('enforces 200 character limit', () => {
    const longMessage = 'a'.repeat(250);
    render(
      <MessagePreview
        message={longMessage}
        creatorDisplayName="@alice"
      />
    );

    const preview = screen.getByTestId('message-preview');
    const displayedText = preview.textContent || '';

    // Should include "@alice says: " + 200 chars
    expect(displayedText).toHaveLength('@alice says: '.length + 200);
  });

  it('shows preview label', () => {
    render(
      <MessagePreview
        message="Test message"
        creatorDisplayName="@alice"
      />
    );

    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows helper text', () => {
    render(
      <MessagePreview
        message="Test message"
        creatorDisplayName="@alice"
      />
    );

    expect(
      screen.getByText('This is how supporters will see your message after tipping')
    ).toBeInTheDocument();
  });
});
