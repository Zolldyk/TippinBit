import { describe, it, expect, beforeAll } from 'vitest';
import { verifyWalletSignature, standardizeMessage } from './verifySignature';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';

describe('verifyWalletSignature', () => {
  let testAccount: ReturnType<typeof privateKeyToAccount>;
  let testSignature: `0x${string}`;
  const testMessage = standardizeMessage('claim @alice');

  beforeAll(async () => {
    // SECURITY WARNING: This is a test-only private key with NO real funds
    // NEVER commit real private keys to version control
    const TEST_PRIVATE_KEY =
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as const;

    // Create test wallet from private key
    testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);

    // Generate real signature for testing
    const walletClient = createWalletClient({
      account: testAccount,
      chain: mainnet,
      transport: http(),
    });

    testSignature = await walletClient.signMessage({ message: testMessage });
  });

  it('verifies valid signature from correct signer', async () => {
    const isValid = await verifyWalletSignature(
      testMessage,
      testSignature,
      testAccount.address
    );

    expect(isValid).toBe(true);
  });

  it('rejects signature from wrong signer', async () => {
    const wrongAddress = '0x0000000000000000000000000000000000000001' as `0x${string}`;
    const isValid = await verifyWalletSignature(testMessage, testSignature, wrongAddress);

    expect(isValid).toBe(false);
  });

  it('rejects invalid signature format', async () => {
    const invalidSignature = '0xINVALID' as `0x${string}`;
    const isValid = await verifyWalletSignature(
      testMessage,
      invalidSignature,
      testAccount.address
    );

    expect(isValid).toBe(false);
  });

  it('rejects signature when message is different', async () => {
    const differentMessage = standardizeMessage('claim @bob');
    const isValid = await verifyWalletSignature(
      differentMessage,
      testSignature,
      testAccount.address
    );

    expect(isValid).toBe(false);
  });

  it('rejects invalid address format', async () => {
    const invalidAddress = 'not-an-address' as `0x${string}`;
    const isValid = await verifyWalletSignature(testMessage, testSignature, invalidAddress);

    expect(isValid).toBe(false);
  });

  it('handles malformed signature gracefully without throwing', async () => {
    const malformedSignatures = [
      '0x' as `0x${string}`,
      '0x123' as `0x${string}`,
      '0xZZZZ' as `0x${string}`,
    ];

    for (const badSig of malformedSignatures) {
      const isValid = await verifyWalletSignature(testMessage, badSig, testAccount.address);
      expect(isValid).toBe(false);
    }
  });

  it('normalizes addresses to checksum format', async () => {
    // Test with lowercase address (should still work due to normalization)
    const lowercaseAddress = testAccount.address.toLowerCase() as `0x${string}`;
    const isValid = await verifyWalletSignature(testMessage, testSignature, lowercaseAddress);

    expect(isValid).toBe(true);
  });
});

describe('standardizeMessage', () => {
  it('formats action into standard message', () => {
    expect(standardizeMessage('claim @alice')).toBe('I claim @alice on TippinBit');
    expect(standardizeMessage('update profile')).toBe('I update profile on TippinBit');
    expect(standardizeMessage('change settings')).toBe('I change settings on TippinBit');
  });

  it('handles empty action string', () => {
    expect(standardizeMessage('')).toBe('I  on TippinBit');
  });

  it('preserves action text exactly', () => {
    const actionWithSpaces = 'claim  @alice  with  spaces';
    expect(standardizeMessage(actionWithSpaces)).toBe(
      `I ${actionWithSpaces} on TippinBit`
    );
  });
});

describe('performance', () => {
  let testAccount: ReturnType<typeof privateKeyToAccount>;
  let testSignature: `0x${string}`;
  const testMessage = standardizeMessage('claim @alice');

  beforeAll(async () => {
    const TEST_PRIVATE_KEY =
      '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' as const;

    testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);

    const walletClient = createWalletClient({
      account: testAccount,
      chain: mainnet,
      transport: http(),
    });

    testSignature = await walletClient.signMessage({ message: testMessage });
  });

  it('verifies signatures in <50ms average', async () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await verifyWalletSignature(testMessage, testSignature, testAccount.address);
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;

    console.log(`Average verification time: ${avgTime.toFixed(2)}ms`);
    expect(avgTime).toBeLessThan(50);
  });
});
