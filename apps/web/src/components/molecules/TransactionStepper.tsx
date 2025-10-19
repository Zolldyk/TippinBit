'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { type StepConfig } from '@/types/domain';

const STEP_COLORS = {
  pending: '#9CA3AF', // Tailwind gray-400
  active: '#FF6B6B', // Coral (primary brand color)
  completed: '#4ECDC4', // Teal (success color)
};

interface TransactionStepperProps {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
  steps: StepConfig[];
}

/**
 * TransactionStepper component
 *
 * Displays a multi-step progress indicator for the BTC borrowing flow.
 * Shows three steps with visual states: pending, active, and completed.
 *
 * Step states:
 * - Pending: Grey color, no checkmark
 * - Active: Coral color, pulsing animation
 * - Completed: Teal color, animated checkmark
 */
export function TransactionStepper({
  currentStep,
  completedSteps,
  steps,
}: TransactionStepperProps) {
  const getStepState = (stepNumber: number): 'pending' | 'active' | 'completed' => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (currentStep === stepNumber) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const state = getStepState(stepNumber);

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative flex items-center justify-center w-12 h-12 rounded-full"
                  animate={{
                    backgroundColor:
                      state === 'completed'
                        ? STEP_COLORS.completed
                        : state === 'active'
                          ? STEP_COLORS.active
                          : STEP_COLORS.pending,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {state === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                      data-testid="step-checkmark"
                    >
                      <Check className="text-white" size={24} />
                    </motion.div>
                  ) : (
                    <span className="text-white font-semibold text-lg">
                      {stepNumber}
                    </span>
                  )}

                  {/* Pulsing ring for active step */}
                  {state === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${STEP_COLORS.active}` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.estimatedTime}</p>
                </div>
              </div>

              {/* Connecting line (except after last step) */}
              {stepNumber < steps.length && (
                <motion.div
                  className="flex-1 h-1 mx-4 rounded-full"
                  initial={{ backgroundColor: STEP_COLORS.pending }}
                  animate={{
                    backgroundColor:
                      completedSteps.includes(stepNumber)
                        ? STEP_COLORS.completed
                        : STEP_COLORS.pending,
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const state = getStepState(stepNumber);

          return (
            <div key={stepNumber} className="flex items-start">
              {/* Step indicator */}
              <div className="flex flex-col items-center mr-4">
                <motion.div
                  className="relative flex items-center justify-center w-10 h-10 rounded-full"
                  animate={{
                    backgroundColor:
                      state === 'completed'
                        ? STEP_COLORS.completed
                        : state === 'active'
                          ? STEP_COLORS.active
                          : STEP_COLORS.pending,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {state === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                      data-testid="step-checkmark"
                    >
                      <Check className="text-white" size={20} />
                    </motion.div>
                  ) : (
                    <span className="text-white font-semibold">{stepNumber}</span>
                  )}

                  {/* Pulsing ring for active step */}
                  {state === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ border: `2px solid ${STEP_COLORS.active}` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Connecting line (except after last step) */}
                {stepNumber < steps.length && (
                  <motion.div
                    className="w-1 h-16 mt-2 rounded-full"
                    initial={{ backgroundColor: STEP_COLORS.pending }}
                    animate={{
                      backgroundColor:
                        completedSteps.includes(stepNumber)
                          ? STEP_COLORS.completed
                          : STEP_COLORS.pending,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>

              {/* Step label */}
              <div className="flex-1 pt-2">
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                <p className="text-xs text-gray-500 mt-1">{step.estimatedTime}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
