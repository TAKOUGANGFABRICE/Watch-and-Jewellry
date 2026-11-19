import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  iconLeft,
  iconRight,
  className = '',
  ...props
}, ref) {
  const containerClasses = [
    styles.inputContainer,
    error ? styles.hasError : '',
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    iconLeft ? styles.withIconLeft : '',
    iconRight ? styles.withIconRight : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={containerClasses}>
        {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </div>

      {error ? (
        <span className={styles.errorMessage}>{error}</span>
      ) : helperText ? (
        <span className={styles.helperText}>{helperText}</span>
      ) : null}
    </div>
  );
});

export default Input;

