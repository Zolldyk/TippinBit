import { type HTMLAttributes } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spinner in pixels
   * @default 20
   */
  size?: number;
  /**
   * Color of the spinner
   * @default 'currentColor'
   */
  color?: string;
}

/**
 * Spinner component for loading states
 *
 * Uses a CSS animation for smooth rotation with accessible markup.
 */
export function Spinner({
  size = 20,
  color = 'currentColor',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block ${className}`}
      {...props}
    >
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
