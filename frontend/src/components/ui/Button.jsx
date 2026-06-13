import React from 'react';
import { Spinner } from './Loader';

const VARIANTS = {
  primary:   'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost:     'btn btn-ghost',
  danger:    'btn btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  fullWidth = false,
  onClick,
  type      = 'button',
  style     = {},
  className = '',
}) {
  const cls = [
    VARIANTS[variant] || 'btn',
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      style={{ justifyContent: fullWidth ? 'center' : undefined, ...style }}
    >
      {loading && (
        <Spinner
          size="sm"
          color={variant === 'primary' ? '#0d0e10' : undefined}
        />
      )}
      {children}
    </button>
  );
}