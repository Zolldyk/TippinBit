import { type Hash } from 'viem';

/**
 * Transaction hash type
 */
export type TxHash = Hash;

/**
 * Borrowing flow state
 *
 * Uses discriminated union for type-safe state management across all
 * steps of the BTC borrowing flow (approve → deposit → execute).
 */
export type BorrowingState =
  | { status: 'idle' }
  | { status: 'step1_preparing' }
  | { status: 'step1_confirming'; txHash: TxHash }
  | {
      status: 'step1_complete';
      txHash: TxHash;
      positionId?: string;
      priceTimestamp?: number;
    }
  | { status: 'step2_preparing' }
  | { status: 'step2_confirming'; txHash: TxHash }
  | { status: 'step2_complete'; txHash: TxHash; positionId: string }
  | { status: 'step3_preparing' }
  | { status: 'step3_confirming'; txHash: TxHash }
  | { status: 'complete'; txHash: TxHash; timestamp: number }
  | { status: 'error'; error: Error; step: 1 | 2 | 3 };

/**
 * Borrowing error types
 */
export enum BorrowingErrorType {
  USER_REJECTED = 'USER_REJECTED', // User cancelled wallet prompt
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS', // Not enough ETH for gas
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // Not enough BTC
  NETWORK_ERROR = 'NETWORK_ERROR', // RPC error
  CONTRACT_ERROR = 'CONTRACT_ERROR', // Contract revert
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Borrowing error interface
 */
export interface BorrowingError extends Error {
  type: BorrowingErrorType;
  step: 1 | 2 | 3;
  retryable: boolean;
}

/**
 * Step configuration for transaction stepper
 */
export interface StepConfig {
  label: string;
  estimatedTime: string; // e.g., "~15 seconds"
}

/**
 * Transaction hashes for all borrowing flow steps
 */
export interface BorrowingTxHashes {
  approve?: TxHash;
  deposit?: TxHash;
  execute?: TxHash;
}

/**
 * Ethereum address type (branded type for type safety)
 */
export type Address = `0x${string}`;

/**
 * Username type (branded type for type safety)
 */
export type Username = `@${string}`;

/**
 * Username record stored in Redis
 *
 * Represents a claimed username with its associated wallet address,
 * signature proof, and timestamp.
 */
export interface UsernameRecord {
  walletAddress: Address;
  message: string; // The message that was signed
  signature: string; // EIP-191 signature
  claimedAt: string; // ISO 8601 timestamp
  thankyouMessage?: string; // Optional thank-you message for supporters
}

/**
 * Username claim request payload
 *
 * Request body for POST /.netlify/functions/username-claim
 */
export interface UsernameClaimRequest {
  username: string;
  walletAddress: Address;
  message: string;
  signature: string;
  thankyouMessage?: string; // Optional thank-you message for supporters
}

/**
 * Username claim response
 *
 * Response from POST /.netlify/functions/username-claim on success
 */
export interface UsernameClaimResponse {
  success: true;
  username: string;
  walletAddress: Address;
}

/**
 * Username lookup response
 *
 * Response from GET /.netlify/functions/username-lookup on success
 */
export interface UsernameLookupResponse {
  username: string;
  walletAddress: Address;
  claimedAt: string;
  thankyouMessage?: string; // Optional thank-you message for supporters
}

/**
 * Username availability states
 *
 * Tracks the state of username availability checking:
 * - idle: No check in progress, input is too short
 * - checking: API call in progress (debouncing or fetching)
 * - available: Username is available to claim
 * - taken: Username is already claimed
 * - unknown: Error occurred during check
 */
export type UsernameAvailability =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'unknown';

/**
 * Username claim error response
 *
 * Error response from POST /.netlify/functions/username-claim
 */
export interface UsernameClaimError {
  error: string;
  code:
    | 'USERNAME_TAKEN'
    | 'INVALID_SIGNATURE'
    | 'VALIDATION_ERROR'
    | 'NETWORK_ERROR';
}

/**
 * Link generator tab selection type
 *
 * Determines which tab is active in the LinkGeneratorContainer
 */
export type LinkGeneratorTab = 'address' | 'username';

/**
 * Username resolution states
 *
 * Tracks the state of username-to-address resolution:
 * - idle: No resolution in progress
 * - loading: API call in progress to fetch wallet address
 * - success: Username successfully resolved to address
 * - not_found: Username not found (404)
 * - error: Network or API error during resolution
 */
export type UsernameResolutionState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'not_found'
  | 'error';

/**
 * Username resolution result
 *
 * Result from useUsernameResolution hook containing the resolution state,
 * resolved address, and any error information.
 */
export interface UsernameResolutionResult {
  status: UsernameResolutionState;
  username?: Username;
  address?: Address;
  claimedAt?: string; // ISO 8601 timestamp
  error?: string;
}

/**
 * Recipient display props
 *
 * Props for displaying recipient information with optional username support.
 * When username is provided, it's shown as primary identifier with address as secondary.
 */
export interface RecipientDisplayProps {
  recipientAddress: Address;
  username?: Username; // Optional username to display
}

/**
 * Session storage cached resolution
 *
 * Cached username-to-address mapping stored in session storage.
 * Includes timestamp for TTL expiration (5 minutes).
 */
export interface CachedUsernameResolution {
  username: string;
  address: Address;
  timestamp: number;
}

/**
 * QR code error correction levels
 * L = Low (7% recovery)
 * M = Medium (15% recovery)
 * Q = Quartile (25% recovery)
 * H = High (30% recovery) - REQUIRED for logo overlay
 */
export type QRCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * QR code generation options
 */
export interface QRCodeOptions {
  errorCorrectionLevel: QRCodeErrorCorrectionLevel;
  width: number;
  margin: number;
  color?: {
    dark: string; // Module color (default: black)
    light: string; // Background color (default: white)
  };
}

/**
 * QR code display component props
 */
export interface QRCodeDisplayProps {
  /** Full payment URL to encode in QR code */
  paymentUrl: string;
  /** QR code size in pixels (default: 300) */
  size?: number;
  /** Show TippinBit logo overlay (default: true) */
  showLogo?: boolean;
  /** Background color for QR code (transparent if not provided) */
  backgroundColor?: string;
  /** Callback when QR code is generated */
  onGenerated?: (dataUrl: string) => void;
}

/**
 * QR code download button props
 */
export interface QRCodeDownloadButtonProps {
  /** QR code as data URL (from QRCodeDisplay) */
  qrCodeDataUrl: string;
  /** Download filename (without .png extension) */
  filename: string;
  /** Button styling variant */
  variant?: 'primary' | 'secondary';
}

/**
 * Payment URL builder params
 */
export interface PaymentUrlParams {
  /** Username (with or without @ prefix) */
  username?: string;
  /** Wallet address */
  address?: Address;
  /** Optional tip amount in USD */
  amount?: string;
  /** Optional thank-you message from creator */
  message?: string;
}

/**
 * Link format selection for username holders
 *
 * Users who have claimed usernames can choose between:
 * - username: tippinbit.com/pay/@alice (memorable)
 * - address: tippinbit.com/pay?to=0x742d... (wallet address)
 */
export type LinkFormat = 'username' | 'address';

/**
 * Address link form props
 */
export interface AddressLinkFormProps {
  /** Pre-filled address from URL param */
  prefilledAddress?: Address;
}

/**
 * Social share buttons props
 */
export interface SocialShareButtonsProps {
  /** Payment URL to share */
  paymentUrl: string;
  /** Optional username for personalized share text */
  username?: string;
}

/**
 * QR code background type
 */
export type QRBackgroundType = 'transparent' | 'white';
