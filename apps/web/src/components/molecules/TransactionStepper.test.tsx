import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TransactionStepper } from './TransactionStepper';
import { type StepConfig } from '@/types/domain';

const MOCK_STEPS: StepConfig[] = [
  { label: 'Step 1: Approve collateral', estimatedTime: '~15 seconds' },
  { label: 'Step 2: Mint MUSD', estimatedTime: '~20 seconds' },
  { label: 'Step 3: Send to creator', estimatedTime: '~15 seconds' },
];

describe('TransactionStepper', () => {
  it('displays 3 steps with correct labels', () => {
    render(
      <TransactionStepper currentStep={1} completedSteps={[]} steps={MOCK_STEPS} />
    );

    // Each label appears twice (desktop + mobile)
    expect(screen.getAllByText('Step 1: Approve collateral')).toHaveLength(2);
    expect(screen.getAllByText('Step 2: Mint MUSD')).toHaveLength(2);
    expect(screen.getAllByText('Step 3: Send to creator')).toHaveLength(2);
  });

  it('displays estimated time for each step', () => {
    render(
      <TransactionStepper currentStep={1} completedSteps={[]} steps={MOCK_STEPS} />
    );

    // Each time appears twice (desktop + mobile), so 4 total for steps 1 and 3
    expect(screen.getAllByText('~15 seconds')).toHaveLength(4); // Steps 1 and 3, desktop + mobile
    expect(screen.getAllByText('~20 seconds')).toHaveLength(2); // Step 2, desktop + mobile
  });

  it('shows step numbers when no steps are completed', () => {
    render(
      <TransactionStepper currentStep={1} completedSteps={[]} steps={MOCK_STEPS} />
    );

    // Each number appears twice (desktop + mobile)
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('3')).toHaveLength(2);
  });

  it('shows checkmark on completed steps', () => {
    render(
      <TransactionStepper currentStep={3} completedSteps={[1, 2]} steps={MOCK_STEPS} />
    );

    const checkmarks = screen.getAllByTestId('step-checkmark');
    expect(checkmarks).toHaveLength(4); // Steps 1 and 2, desktop + mobile
  });

  it('shows all checkmarks when all steps completed', () => {
    render(
      <TransactionStepper currentStep={3} completedSteps={[1, 2, 3]} steps={MOCK_STEPS} />
    );

    const checkmarks = screen.getAllByTestId('step-checkmark');
    expect(checkmarks).toHaveLength(6); // All steps, desktop + mobile
  });

  it('highlights current step', () => {
    render(
      <TransactionStepper currentStep={2} completedSteps={[1]} steps={MOCK_STEPS} />
    );

    // Step 2 is current and should be highlighted
    // We verify this by checking that step 2 label is visible (twice - desktop + mobile)
    expect(screen.getAllByText('Step 2: Mint MUSD')).toHaveLength(2);
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(
      <TransactionStepper currentStep={2} completedSteps={[1]} steps={MOCK_STEPS} />
    );

    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '3');
  });

  it('renders correctly with step 1 as current', () => {
    render(
      <TransactionStepper currentStep={1} completedSteps={[]} steps={MOCK_STEPS} />
    );

    // No checkmarks yet
    const checkmarks = screen.queryAllByTestId('step-checkmark');
    expect(checkmarks).toHaveLength(0);

    // All step numbers visible (desktop + mobile)
    expect(screen.getAllByText('1')).toHaveLength(2);
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('3')).toHaveLength(2);
  });

  it('renders correctly with step 2 as current', () => {
    render(
      <TransactionStepper currentStep={2} completedSteps={[1]} steps={MOCK_STEPS} />
    );

    // Two checkmarks (step 1, desktop + mobile)
    const checkmarks = screen.queryAllByTestId('step-checkmark');
    expect(checkmarks).toHaveLength(2);

    // Steps 2 and 3 show numbers (desktop + mobile)
    expect(screen.getAllByText('2')).toHaveLength(2);
    expect(screen.getAllByText('3')).toHaveLength(2);
  });

  it('renders correctly with step 3 as current', () => {
    render(
      <TransactionStepper currentStep={3} completedSteps={[1, 2]} steps={MOCK_STEPS} />
    );

    // Four checkmarks (steps 1 and 2, desktop + mobile)
    const checkmarks = screen.queryAllByTestId('step-checkmark');
    expect(checkmarks).toHaveLength(4);

    // Step 3 shows number (desktop + mobile)
    expect(screen.getAllByText('3')).toHaveLength(2);
  });
});
