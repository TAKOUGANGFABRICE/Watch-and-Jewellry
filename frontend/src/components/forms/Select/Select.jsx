import React, { forwardRef } from 'react';
import styles from './Select.module.css';

const Select = forwardRef(function Select({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  placeholder = 'Sélectionnez une option',
  required = false,
  disabled = false,
  className = '',
  ...props
}, ref) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.selectContainer} ${error ? styles.hasError : ''}`}>
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={styles.select}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {text}
              </option>
            );
          })}
        </select>
        <span className={styles.arrow} />
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

export default Select;

