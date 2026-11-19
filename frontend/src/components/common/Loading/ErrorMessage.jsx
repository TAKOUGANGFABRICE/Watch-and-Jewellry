import React from 'react';
import Button from '../Button/Button';
import styles from './ErrorMessage.module.css';

export default function ErrorMessage({
  title = "Une erreur est survenue",
  message = "Nous n'avons pas pu charger les données. Veuillez réessayer.",
  onRetry,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.iconCircle}>!</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

