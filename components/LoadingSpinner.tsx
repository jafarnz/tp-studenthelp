import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <div className={`animate-spin rounded-full border-4 border-gray-200 border-t-4 border-t-[var(--primary-color)] ${sizeClasses[size]}`}></div>
      <span className="text-gray-600 font-medium">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
