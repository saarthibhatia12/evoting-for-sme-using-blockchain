// =============================================================================
// LOADING SPINNER - Task 4.7
// Reusable loading indicator components
// =============================================================================

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
    xl: 64,
  };

  const colorMap = {
    primary: '#3b82f6',
    white: '#ffffff',
    gray: '#6b7280',
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = colorMap[color];

  return (
    <div
      className={`loading-spinner ${className}`}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `${spinnerSize / 8}px solid #e5e7eb`,
        borderTopColor: spinnerColor,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  children,
}) => {
  if (!isLoading) return <>{children}</>;

  return (
    <>
      {children}
      <div className={`loading-overlay ${fullScreen ? 'fullscreen' : ''}`}>
        <div className="loading-content">
          <LoadingSpinner size="lg" />
          {message && <p className="loading-message">{message}</p>}
        </div>

        <style>{`
          .loading-overlay {
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            backdrop-filter: blur(2px);
          }

          .loading-overlay.fullscreen {
            position: fixed;
            z-index: 9999;
          }

          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }

          .loading-message {
            color: #374151;
            font-size: 0.95rem;
            font-weight: 500;
            margin: 0;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary text-white hover-primary',
    secondary: 'bg-secondary text-white hover-secondary',
    success: 'bg-success text-white hover-success',
    danger: 'bg-danger text-white hover-danger',
    outline: 'bg-white border text-gray hover-outline',
  };

  const sizeStyles = {
    sm: 'padding-sm font-sm',
    md: 'padding-md font-md',
    lg: 'padding-lg font-lg',
  };

  return (
    <button
      className={`loading-button ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color={variant === 'outline' ? 'primary' : 'white'} />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        children
      )}

      <style>{`
        .loading-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          outline: none;
        }

        .loading-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Variants */
        .loading-button.bg-primary {
          background: #3b82f6;
          color: white;
        }
        .loading-button.bg-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .loading-button.bg-secondary {
          background: #6b7280;
          color: white;
        }
        .loading-button.bg-secondary:hover:not(:disabled) {
          background: #4b5563;
        }

        .loading-button.bg-success {
          background: #10b981;
          color: white;
        }
        .loading-button.bg-success:hover:not(:disabled) {
          background: #059669;
        }

        .loading-button.bg-danger {
          background: #ef4444;
          color: white;
        }
        .loading-button.bg-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .loading-button.bg-white {
          background: white;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        .loading-button.bg-white:hover:not(:disabled) {
          background: #f3f4f6;
        }

        /* Sizes */
        .loading-button.padding-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
        .loading-button.padding-md {
          padding: 0.625rem 1.25rem;
          font-size: 0.95rem;
        }
        .loading-button.padding-lg {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }
      `}</style>
    </button>
  );
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
    >
      <style>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
