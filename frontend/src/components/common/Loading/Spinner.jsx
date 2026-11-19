import React from 'react';
import styles from './Spinner.module.css';

export default function Spinner({ size = 'md', color = 'gold', fullPage = false, text }) {
  const sizeClass = styles[size] || styles.md;
  const colorClass = styles[color] || styles.gold;

  const content = (
    <div className={styles.spinnerWrapper}>
      <div className={`${styles.spinner} ${sizeClass} ${colorClass}`} />
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className={styles.fullPage}>{content}</div>;
  }

  return content;
}

