import { parseEther, formatUnits } from 'viem';

/**
 * Borrowing configuration constants
 *
 * These constants define the collateralization ratios and safety buffers
 * for the BTC borrowing flow.
 */
export const BORROWING_CONFIG = {
  MIN_COLLATERAL_RATIO: 2.0, // 200% (Mezo protocol minimum)
  TARGET_COLLATERAL_RATIO: 2.05, // 205% (5% buffer above minimum)
  SAFETY_BUFFER: 1.05, // 5% additional safety buffer
  EFFECTIVE_RATIO: 2.1525, // 2.05 * 1.05 = 215.25% (final ratio)
  EFFECTIVE_RATIO_SCALED: BigInt(Math.floor(2.1525 * 1e18)),
  PRICE_CACHE_TTL: 300_000, // 5 minutes in milliseconds
  PRICE_STALENESS_THRESHOLD: 600_000, // 10 minutes in milliseconds
  SLIPPAGE_WARNING_THRESHOLD: 2.0, // 2% change triggers warning (Story 2.4)
};

/**
 * Calculate BTC collateral required for a given MUSD tip amount
 *
 * Formula: (tipAmount * EFFECTIVE_RATIO_SCALED) / btcPrice
 * - tipAmount: Tip amount in wei (18 decimals)
 * - EFFECTIVE_RATIO: 215.25% (205% target + 5% safety buffer)
 * - btcPrice: Current BTC price in USD scaled by 1e18
 *
 * @param tipAmount - Tip amount in wei (18 decimals)
 * @param btcPrice - BTC price in USD scaled by 1e18 (e.g., BigInt(50000 * 1e18) for $50,000/BTC)
 * @returns Required BTC collateral in wei (18 decimals)
 *
 * @example
 * const tipAmount = parseEther('10'); // $10 MUSD
 * const btcPrice = BigInt(50000) * BigInt(1e18); // $50,000/BTC
 * const collateral = calculateCollateralRequired(tipAmount, btcPrice);
 * // Returns 0.0004305 BTC (430500000000000000n wei)
 */
export function calculateCollateralRequired(
  tipAmount: bigint,
  btcPrice: bigint
): bigint {
  if (tipAmount === BigInt(0)) return BigInt(0);
  return (tipAmount * BORROWING_CONFIG.EFFECTIVE_RATIO_SCALED) / btcPrice;
}

/**
 * Calculate maximum tip amount for given BTC collateral
 *
 * This is the inverse of calculateCollateralRequired, used for the
 * "reduce tip" helper to find the maximum affordable tip.
 *
 * Formula: (btcBalance * btcPrice) / EFFECTIVE_RATIO_SCALED
 *
 * @param btcBalance - Available BTC balance in wei (18 decimals)
 * @param btcPrice - BTC price in USD scaled by 1e18
 * @returns Maximum tip amount in wei (18 decimals)
 *
 * @example
 * const btcBalance = parseEther('0.001'); // 0.001 BTC
 * const btcPrice = BigInt(50000) * BigInt(1e18);
 * const maxTip = calculateMaxTipFromCollateral(btcBalance, btcPrice);
 * // Returns ~23.24 MUSD
 */
export function calculateMaxTipFromCollateral(
  btcBalance: bigint,
  btcPrice: bigint
): bigint {
  if (btcBalance === BigInt(0)) return BigInt(0);
  return (btcBalance * btcPrice) / BORROWING_CONFIG.EFFECTIVE_RATIO_SCALED;
}

/**
 * Calculate minimum BTC required to borrow $1 MUSD
 *
 * Formula: MIN_TIP * EFFECTIVE_RATIO / btcPrice
 * - MIN_TIP: 1 MUSD (smallest viable tip)
 * - EFFECTIVE_RATIO: 215.25% (205% target + 5% safety buffer)
 * - btcPrice: Current BTC price in USD (as bigint)
 *
 * @param btcPrice - BTC price in USD (e.g., 50000n for $50,000/BTC)
 * @returns Minimum BTC required in wei (18 decimals)
 *
 * @example
 * const minBtc = calculateMinimumBtcRequired(50000n);
 * // Returns ~0.00004305 BTC (43050000000000 wei)
 */
export function calculateMinimumBtcRequired(btcPrice: bigint): bigint {
  const MIN_TIP = parseEther('1'); // 1 MUSD

  return (MIN_TIP * BORROWING_CONFIG.EFFECTIVE_RATIO_SCALED) / (btcPrice * BigInt(1e18));
}

/**
 * Format BTC amount from wei to display string
 *
 * @param amount - BTC amount in wei (18 decimals)
 * @returns Formatted string with 6 decimal places
 *
 * @example
 * const formatted = formatBtcAmount(parseEther('0.001234'));
 * // Returns "0.001234"
 */
export function formatBtcAmount(amount: bigint): string {
  return parseFloat(formatUnits(amount, 18)).toFixed(6);
}

/**
 * Format USD amount from wei to display string
 *
 * Converts bigint wei amount to USD string with 2 decimal places
 * and thousand separators.
 *
 * @param amount - Amount in wei (18 decimals)
 * @returns Formatted USD string with 2 decimals (e.g., "1,234.56")
 *
 * @example
 * formatUsdAmount(parseEther('10.5')) // "10.50"
 * formatUsdAmount(parseEther('1234.56')) // "1,234.56"
 */
export function formatUsdAmount(amount: bigint): string {
  const value = Number(formatUnits(amount, 18));
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
