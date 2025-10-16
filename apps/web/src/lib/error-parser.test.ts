import { describe, it, expect } from 'vitest';
import { parseContractError, validateTxHash, type TransactionErrorResult } from './error-parser';
import { BaseError } from 'viem';

describe('parseContractError', () => {
  it('returns isUserRejection true for UserRejectedRequestError', () => {
    const error = new BaseError('User rejected');
    error.name = 'UserRejectedRequestError';

    const result: TransactionErrorResult = parseContractError(error);

    expect(result.isUserRejection).toBe(true);
    expect(result.code).toBe('USER_REJECTED');
    expect(result.userMessage).toBe('');
  });

  it('returns user-friendly message for InsufficientFundsError', () => {
    const error = new BaseError('Insufficient funds');
    error.name = 'InsufficientFundsError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('INSUFFICIENT_FUNDS');
    expect(result.userMessage).toBe("You don't have enough MUSD for this transaction");
  });

  it('returns user-friendly message for TransactionExecutionError', () => {
    const error = new BaseError('Transaction execution failed');
    error.name = 'TransactionExecutionError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('TX_FAILED');
    expect(result.userMessage).toBe('Transaction failed on the blockchain. Your funds are safe.');
  });

  it('returns user-friendly message for ContractFunctionExecutionError', () => {
    const error = new BaseError('Contract function execution failed');
    error.name = 'ContractFunctionExecutionError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('TX_FAILED');
    expect(result.userMessage).toBe('Transaction failed on the blockchain. Your funds are safe.');
  });

  it('returns user-friendly message for EstimateGasExecutionError', () => {
    const error = new BaseError('Gas estimation failed');
    error.name = 'EstimateGasExecutionError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('GAS_ESTIMATION_FAILED');
    expect(result.userMessage).toBe('Unable to estimate gas. Transaction may fail.');
  });

  it('returns user-friendly message for gas estimation in error message', () => {
    const error = new BaseError('Failed during gas estimation');
    error.name = 'SomeOtherError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('GAS_ESTIMATION_FAILED');
    expect(result.userMessage).toBe('Unable to estimate gas. Transaction may fail.');
  });

  it('returns user-friendly message for TimeoutError', () => {
    const error = new BaseError('Request timeout');
    error.name = 'TimeoutError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('TIMEOUT');
    expect(result.userMessage).toBe('Transaction confirmation timed out. Check explorer.');
  });

  it('returns user-friendly message for insufficient funds in error message', () => {
    const error = new BaseError('You have insufficient funds for this transaction');
    error.name = 'SomeError';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('INSUFFICIENT_FUNDS');
    expect(result.userMessage).toBe("You don't have enough MUSD for this transaction");
  });

  it('returns fallback message for unknown error', () => {
    const error = new Error('Some random error');

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('UNKNOWN');
    expect(result.userMessage).toBe('An unexpected error occurred. Please try again.');
  });

  it('handles non-Error objects gracefully', () => {
    const error = 'string error';

    const result = parseContractError(error);

    expect(result.isUserRejection).toBe(false);
    expect(result.code).toBe('UNKNOWN');
    expect(result.userMessage).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('validateTxHash', () => {
  it('returns true for valid transaction hash', () => {
    const validHash = '0x' + 'a'.repeat(64);
    expect(validateTxHash(validHash)).toBe(true);
  });

  it('returns true for valid hash with mixed case', () => {
    const validHash = '0x' + 'AbCdEf1234567890'.repeat(4); // 64 chars
    expect(validateTxHash(validHash)).toBe(true);
  });

  it('returns false for hash without 0x prefix', () => {
    const invalidHash = 'a'.repeat(64);
    expect(validateTxHash(invalidHash)).toBe(false);
  });

  it('returns false for hash that is too short', () => {
    const invalidHash = '0x' + 'a'.repeat(63);
    expect(validateTxHash(invalidHash)).toBe(false);
  });

  it('returns false for hash that is too long', () => {
    const invalidHash = '0x' + 'a'.repeat(65);
    expect(validateTxHash(invalidHash)).toBe(false);
  });

  it('returns false for hash with non-hex characters', () => {
    const invalidHash = '0x' + 'g'.repeat(64);
    expect(validateTxHash(invalidHash)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(validateTxHash('')).toBe(false);
  });

  it('returns false for only 0x prefix', () => {
    expect(validateTxHash('0x')).toBe(false);
  });

  it('returns false for hash with special characters', () => {
    const invalidHash = '0x' + 'a'.repeat(60) + '@#$%';
    expect(validateTxHash(invalidHash)).toBe(false);
  });

  it('returns false for hash with spaces', () => {
    const invalidHash = '0x' + 'a'.repeat(60) + '    ';
    expect(validateTxHash(invalidHash)).toBe(false);
  });
});
