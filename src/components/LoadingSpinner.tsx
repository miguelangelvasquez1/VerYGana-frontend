'use client';
import React from 'react';

interface Props {
  size?: number;
  className?: string;
  label?: string;
}

export default function LoadingSpinner({ size = 20, className = '', label }: Props) {
  return (
    <div role="status" aria-live="polite" className={`inline-flex items-center ${className}`}>
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" />
      </svg>
      {label ? <span className="ml-2 text-sm">{label}</span> : null}
    </div>
  );
}
