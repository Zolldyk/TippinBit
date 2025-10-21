import { describe, it, expect } from 'vitest';
import { buildPaymentUrl } from './payment-url';
import { encodeMessageForUrl, decodeMessageFromUrl } from './formatting';
import { sanitizeMessage, validateMessageLength } from './validation';

/**
 * Integration Tests for Creator Message Flow
 *
 * Tests the complete flow of message handling from:
 * 1. User input → validation → encoding
 * 2. URL parameter → decoding → sanitization → display
 */
describe('Creator Message Flow Integration', () => {
  describe('Message Input → URL Generation Flow', () => {
    it('validates message length before encoding', () => {
      const message = 'Thank you for your support!';
      const validation = validateMessageLength(message);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('rejects messages over 200 characters', () => {
      const message = 'a'.repeat(201);
      const validation = validateMessageLength(message);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Message too long. Please shorten to 200 characters.');
    });

    it('encodes valid message for URL', () => {
      const message = 'Thank you for the coffee! ☕';
      const encoded = encodeMessageForUrl(message);

      expect(encoded).toBe('Thank%20you%20for%20the%20coffee!%20%E2%98%95');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('builds payment URL with encoded message for @username', () => {
      const message = 'Thank you!';
      const url = buildPaymentUrl({
        username: '@alice',
        message,
      });

      expect(url).toContain('/pay/@alice');
      expect(url).toContain('message=Thank+you%21'); // URL.searchParams encodes space as + and ! as %21
    });

    it('builds payment URL with encoded message for address', () => {
      const message = 'Thanks for the tip!';
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`;
      const url = buildPaymentUrl({
        address,
        message,
      });

      expect(url).toContain('/pay?to=');
      expect(url).toContain('message=Thanks+for+the+tip%21'); // URL.searchParams encoding
    });

    it('handles emoji in message URL encoding', () => {
      const message = 'Thank you! ❤️🙏';
      const url = buildPaymentUrl({
        username: '@bob',
        message,
      });

      expect(url).toContain('message=');
      // Emoji should be properly encoded
      expect(url).toContain('%E2%9D%A4'); // ❤️
    });

    it('excludes message parameter when message is empty', () => {
      const url = buildPaymentUrl({
        username: '@alice',
        message: '',
      });

      expect(url).not.toContain('message=');
    });

    it('includes both amount and message parameters', () => {
      const url = buildPaymentUrl({
        username: '@alice',
        amount: '10',
        message: 'Thanks!',
      });

      expect(url).toContain('amount=10');
      expect(url).toContain('message=Thanks%21'); // URL.searchParams encoding
    });
  });

  describe('URL Parameter → Message Display Flow', () => {
    it('decodes message from URL parameter', () => {
      const encoded = 'Thank%20you!';
      const decoded = decodeMessageFromUrl(encoded);

      expect(decoded).toBe('Thank you!');
    });

    it('decodes emoji correctly', () => {
      const encoded = 'Thank%20you!%20%E2%98%95';
      const decoded = decodeMessageFromUrl(encoded);

      expect(decoded).toBe('Thank you! ☕');
    });

    it('sanitizes decoded message for XSS protection', () => {
      // Simulate a malicious message that was URL-encoded
      const malicious = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeMessage(malicious);

      expect(sanitized).toBe('Hello');
      expect(sanitized).not.toContain('<script>');
    });

    it('preserves emoji after sanitization', () => {
      const message = 'Thank you! ❤️🙏';
      const sanitized = sanitizeMessage(message);

      expect(sanitized).toBe('Thank you! ❤️🙏');
    });

    it('enforces 200 char limit during sanitization', () => {
      const longMessage = 'a'.repeat(250);
      const sanitized = sanitizeMessage(longMessage);

      expect(sanitized).toHaveLength(200);
    });

    it('handles malformed URL encoding gracefully', () => {
      const malformed = 'Invalid%2';
      const decoded = decodeMessageFromUrl(malformed);

      expect(decoded).toBe(''); // Should return empty string, not throw
    });
  });

  describe('Complete Roundtrip Flow', () => {
    it('maintains message integrity through URL → decode → sanitize', () => {
      const originalMessage = 'Thank you for the coffee! ☕';

      // Step 1: Validate
      const validation = validateMessageLength(originalMessage);
      expect(validation.isValid).toBe(true);

      // Step 2: Build payment URL (URL.searchParams handles encoding)
      const url = buildPaymentUrl({
        username: '@alice',
        message: originalMessage,
      });
      expect(url).toContain('message=');

      // Step 3: Extract from URL (simulating receiver)
      const urlObj = new URL(url);
      const messageParam = urlObj.searchParams.get('message');
      expect(messageParam).toBeTruthy();

      // Step 4: Message is already decoded by URL.searchParams.get()
      // No need to call decodeMessageFromUrl since searchParams handles it

      // Step 5: Sanitize
      const sanitized = sanitizeMessage(messageParam!);

      // Verify integrity
      expect(sanitized).toBe(originalMessage);
    });

    it('handles special characters throughout flow', () => {
      const message = 'Thank you! $5 & appreciation';

      const url = buildPaymentUrl({ username: '@alice', message });
      const urlObj = new URL(url);
      const messageParam = urlObj.searchParams.get('message');
      // URL.searchParams.get() automatically decodes
      const sanitized = sanitizeMessage(messageParam!);

      expect(sanitized).toBe(message);
    });

    it('sanitizes malicious content', () => {
      // Simulate attacker trying to inject script
      const malicious = '<img src=x onerror=alert(1)>Nice tip!';

      // Sanitization should remove the XSS
      const sanitized = sanitizeMessage(malicious);
      expect(sanitized).toBe('Nice tip!');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
    });

    it('handles edge case: empty message throughout flow', () => {
      const message = '';

      const validation = validateMessageLength(message);
      expect(validation.isValid).toBe(true); // Empty is valid

      const encoded = encodeMessageForUrl(message);
      expect(encoded).toBe(''); // Should return empty string

      const url = buildPaymentUrl({ username: '@alice', message });
      expect(url).not.toContain('message='); // Should not add param
    });

    it('handles edge case: whitespace-only message', () => {
      const message = '   ';

      const encoded = encodeMessageForUrl(message);
      expect(encoded).toBe(''); // Should trim and return empty

      const sanitized = sanitizeMessage(message);
      expect(sanitized).toBe(''); // Should trim
    });

    it('limits message at exactly 200 chars', () => {
      const message = 'a'.repeat(200);

      const validation = validateMessageLength(message);
      expect(validation.isValid).toBe(true);

      const sanitized = sanitizeMessage(message);
      expect(sanitized).toHaveLength(200);
    });
  });

  describe('Message Priority Flow (URL vs Stored)', () => {
    it('URL message should take precedence over stored message', () => {
      // This test documents the expected behavior:
      // When both URL parameter and stored message exist,
      // URL parameter takes precedence
      const urlMessage = 'Custom message from URL';
      const storedMessage = 'Stored message from Redis';

      // Simulate the logic from confirmation page
      const finalMessage = urlMessage || storedMessage;

      expect(finalMessage).toBe(urlMessage);
    });

    it('falls back to stored message when URL message is empty', () => {
      const urlMessage = undefined;
      const storedMessage = 'Stored message from Redis';

      const finalMessage = urlMessage || storedMessage;

      expect(finalMessage).toBe(storedMessage);
    });

    it('uses generic fallback when both are empty', () => {
      const urlMessage = undefined;
      const storedMessage = undefined;

      const finalMessage = urlMessage || storedMessage || 'Thank you for your support! ❤️';

      expect(finalMessage).toBe('Thank you for your support! ❤️');
    });
  });
});
