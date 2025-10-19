import { describe, it, expect } from 'vitest';
import { parseEther } from 'viem';
import {
  calculateCollateralRequired,
  calculateMaxTipFromCollateral,
  formatUsdAmount,
  formatBtcAmount,
  BORROWING_CONFIG,
} from './btc-calculations';

describe('BORROWING_CONFIG', () => {
  it('has correct effective ratio (215.25%)', () => {
    expect(BORROWING_CONFIG.EFFECTIVE_RATIO).toBe(2.1525);
    expect(BORROWING_CONFIG.EFFECTIVE_RATIO).toBe(
      BORROWING_CONFIG.TARGET_COLLATERAL_RATIO * BORROWING_CONFIG.SAFETY_BUFFER
    );
  });

  it('has correct scaled effective ratio for bigint calculations', () => {
    const expectedScaled = BigInt(Math.floor(2.1525 * 1e18));
    expect(BORROWING_CONFIG.EFFECTIVE_RATIO_SCALED).toBe(expectedScaled);
  });
});

describe('calculateCollateralRequired', () => {
  it('applies 215.25% effective ratio correctly at $50k BTC', () => {
    const tipAmount = parseEther('10'); // $10 MUSD
    const btcPrice = BigInt(50000) * BigInt(1e18); // $50,000/BTC scaled by 1e18

    const collateral = calculateCollateralRequired(tipAmount, btcPrice);

    // Expected: (10e18 * 2.1525e18) / 50000e18 ≈ 0.0004305 BTC = 430500000000000 wei
    // Due to bigint division truncation, we check it's approximately correct
    const expectedMin = BigInt(430000000000000); // 0.00043 BTC
    const expectedMax = BigInt(431000000000000); // 0.000431 BTC
    expect(collateral).toBeGreaterThanOrEqual(expectedMin);
    expect(collateral).toBeLessThanOrEqual(expectedMax);
  });

  it('applies 215.25% effective ratio correctly at $30k BTC', () => {
    const tipAmount = parseEther('5'); // $5 MUSD
    const btcPrice = BigInt(30000) * BigInt(1e18); // $30,000/BTC scaled by 1e18

    const collateral = calculateCollateralRequired(tipAmount, btcPrice);

    // Expected: (5 * 2.1525) / 30000 ≈ 0.00035875 BTC
    const expectedMin = BigInt(358000000000000);
    const expectedMax = BigInt(359000000000000);
    expect(collateral).toBeGreaterThanOrEqual(expectedMin);
    expect(collateral).toBeLessThanOrEqual(expectedMax);
  });

  it('handles various BTC price points correctly', () => {
    const tipAmount = parseEther('5'); // $5 MUSD

    const at30k = calculateCollateralRequired(tipAmount, BigInt(30000) * BigInt(1e18));
    const at50k = calculateCollateralRequired(tipAmount, BigInt(50000) * BigInt(1e18));
    const at100k = calculateCollateralRequired(tipAmount, BigInt(100000) * BigInt(1e18));

    // Higher BTC price = less BTC collateral needed
    expect(at100k).toBeLessThan(at50k);
    expect(at50k).toBeLessThan(at30k);
  });

  it('handles various tip amounts correctly', () => {
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const tip1 = calculateCollateralRequired(parseEther('1'), btcPrice);
    const tip5 = calculateCollateralRequired(parseEther('5'), btcPrice);
    const tip10 = calculateCollateralRequired(parseEther('10'), btcPrice);
    const tip100 = calculateCollateralRequired(parseEther('100'), btcPrice);

    // Larger tip = more collateral needed (approximately linear relationship)
    // Note: Due to bigint division truncation, we use approximate checks
    expect(tip5).toBeGreaterThan(tip1 * BigInt(4));
    expect(tip5).toBeLessThan(tip1 * BigInt(6));
    expect(tip10).toBeGreaterThan(tip1 * BigInt(9));
    expect(tip10).toBeLessThan(tip1 * BigInt(11));
    expect(tip100).toBeGreaterThan(tip1 * BigInt(99));
    expect(tip100).toBeLessThan(tip1 * BigInt(101));
  });

  it('returns 0 for zero tip amount', () => {
    const btcPrice = BigInt(50000) * BigInt(1e18);
    const collateral = calculateCollateralRequired(BigInt(0), btcPrice);
    expect(collateral).toBe(BigInt(0));
  });

  it('handles very small tip amounts without losing precision', () => {
    const tipAmount = parseEther('0.01'); // $0.01 MUSD
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const collateral = calculateCollateralRequired(tipAmount, btcPrice);

    // Should return non-zero value for tiny amounts
    expect(collateral).toBeGreaterThan(BigInt(0));
  });

  it('handles very large tip amounts without overflow', () => {
    const tipAmount = parseEther('1000000'); // $1M MUSD
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const collateral = calculateCollateralRequired(tipAmount, btcPrice);

    // Expected: (1000000 * 2.1525) / 50000 ≈ 43.05 BTC
    const expectedMin = parseEther('43');
    const expectedMax = parseEther('43.1');
    expect(collateral).toBeGreaterThanOrEqual(expectedMin);
    expect(collateral).toBeLessThanOrEqual(expectedMax);
  });
});

describe('calculateMaxTipFromCollateral', () => {
  it('calculates inverse of collateralRequired correctly', () => {
    const btcBalance = parseEther('0.001'); // 0.001 BTC
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const maxTip = calculateMaxTipFromCollateral(btcBalance, btcPrice);

    // Expected: (0.001 * 50000) / 2.1525 ≈ $23.24 MUSD
    // Verify by doing reverse calculation (within rounding tolerance)
    const reverseCollateral = calculateCollateralRequired(maxTip, btcPrice);
    // Due to bigint rounding, reverse calculation may be off by 1 wei
    expect(reverseCollateral).toBeLessThanOrEqual(btcBalance);
    expect(reverseCollateral).toBeGreaterThanOrEqual(btcBalance - BigInt(1e15)); // Within 0.001 of original
  });

  it('returns max affordable tip at various BTC prices', () => {
    const btcBalance = parseEther('0.01'); // 0.01 BTC

    const at30k = calculateMaxTipFromCollateral(btcBalance, BigInt(30000) * BigInt(1e18));
    const at50k = calculateMaxTipFromCollateral(btcBalance, BigInt(50000) * BigInt(1e18));
    const at100k = calculateMaxTipFromCollateral(btcBalance, BigInt(100000) * BigInt(1e18));

    // Higher BTC price = more USD can be borrowed with same collateral
    expect(at100k).toBeGreaterThan(at50k);
    expect(at50k).toBeGreaterThan(at30k);
  });

  it('returns 0 for zero BTC balance', () => {
    const btcPrice = BigInt(50000) * BigInt(1e18);
    const maxTip = calculateMaxTipFromCollateral(BigInt(0), btcPrice);
    expect(maxTip).toBe(BigInt(0));
  });

  it('handles small BTC amounts correctly', () => {
    const btcBalance = parseEther('0.0001'); // 0.0001 BTC
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const maxTip = calculateMaxTipFromCollateral(btcBalance, btcPrice);

    // Should return non-zero value
    expect(maxTip).toBeGreaterThan(BigInt(0));
  });
});

describe('formatUsdAmount', () => {
  it('formats with 2 decimal places', () => {
    expect(formatUsdAmount(parseEther('10.5'))).toBe('10.50');
    expect(formatUsdAmount(parseEther('5.123456'))).toBe('5.12');
  });

  it('adds thousands separator', () => {
    expect(formatUsdAmount(parseEther('1234.56'))).toBe('1,234.56');
    expect(formatUsdAmount(parseEther('1000000'))).toBe('1,000,000.00');
  });

  it('handles zero correctly', () => {
    expect(formatUsdAmount(parseEther('0'))).toBe('0.00');
  });

  it('handles very small amounts', () => {
    expect(formatUsdAmount(parseEther('0.01'))).toBe('0.01');
    expect(formatUsdAmount(parseEther('0.001'))).toBe('0.00');
  });

  it('handles large amounts', () => {
    expect(formatUsdAmount(parseEther('999999.99'))).toBe('999,999.99');
  });
});

describe('formatBtcAmount', () => {
  it('formats with 6 decimal places', () => {
    expect(formatBtcAmount(parseEther('0.001234'))).toBe('0.001234');
    expect(formatBtcAmount(parseEther('0.123456'))).toBe('0.123456');
  });

  it('pads with zeros to 6 decimals', () => {
    expect(formatBtcAmount(parseEther('0.1'))).toBe('0.100000');
    expect(formatBtcAmount(parseEther('1'))).toBe('1.000000');
  });

  it('handles very small amounts', () => {
    expect(formatBtcAmount(parseEther('0.000001'))).toBe('0.000001');
  });

  it('handles zero correctly', () => {
    expect(formatBtcAmount(parseEther('0'))).toBe('0.000000');
  });
});

describe('Edge cases and precision', () => {
  it('maintains precision for round-trip calculations', () => {
    const originalTip = parseEther('15.75');
    const btcPrice = BigInt(50000) * BigInt(1e18);

    const collateral = calculateCollateralRequired(originalTip, btcPrice);
    const maxTip = calculateMaxTipFromCollateral(collateral, btcPrice);

    // Should get back approximately the same value (within rounding tolerance)
    // Due to bigint division truncation, small rounding errors are expected
    const tolerance = parseEther('0.01'); // $0.01 tolerance
    expect(maxTip).toBeGreaterThanOrEqual(originalTip - tolerance);
    expect(maxTip).toBeLessThanOrEqual(originalTip + tolerance);
  });

  it('handles edge case: exact minimum collateral ratio', () => {
    // Verify effective ratio matches expected 215.25%
    const tipAmount = parseEther('100'); // $100 MUSD
    const btcPrice = BigInt(50000) * BigInt(1e18);
    const collateral = calculateCollateralRequired(tipAmount, btcPrice);

    // Collateral value in USD = (collateral * btcPrice) / 1e18
    const collateralUsd = (collateral * btcPrice) / BigInt(1e18);
    const ratio = Number(collateralUsd) / Number(tipAmount);

    // Should be 2.1525 (215.25%)
    expect(ratio).toBeCloseTo(2.1525, 4);
  });
});
