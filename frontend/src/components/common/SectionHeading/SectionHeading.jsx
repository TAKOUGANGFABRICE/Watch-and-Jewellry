import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SectionHeading.module.css';

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  action,
  className = '',
}) {
  const alignClass = align === 'left' ? styles.alignLeft : styles.alignCenter;

  return (
    <div className={`${styles.wrapper} ${alignClass} ${className}`}>
      <div className={styles.content}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        {title && <h2 className={styles.title}>{title}</h2>}
        {description && <p className={styles.description}>{description}</p>}
      </div>

      {action && (
        <div className={styles.action}>
          {action.to ? (
            <Link to={action.to} className={styles.actionLink}>
              {action.label} <span className={styles.arrow}>→</span>
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={styles.actionLink}>
              {action.label} <span className={styles.arrow}>→</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

