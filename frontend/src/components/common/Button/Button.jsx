import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  to,
  href,
  onClick,
  type = 'button',
  startIcon,
  endIcon,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
    'dark-outline': styles.darkOutline,
    ghost: styles.ghost,
  }[variant] || styles.primary;

  const sizeClass = styles[size] || styles.md;
  const widthClass = fullWidth ? styles.fullWidth : '';
  const combinedClasses = `${styles.button} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const content = (
    <>
      {isLoading && <span className={styles.spinner} />}
      {!isLoading && startIcon && <span className={styles.icon}>{startIcon}</span>}
      <span>{children}</span>
      {!isLoading && endIcon && <span className={styles.icon}>{endIcon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={combinedClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}

