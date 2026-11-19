import React from 'react';
import Button from '../Button/Button';
import styles from './EmptyState.module.css';

export default function EmptyState({
  icon,
  title = "Aucun élément trouvé",
  description = "Il n'y a actuellement aucun résultat à afficher.",
  actionText,
  actionTo,
  onAction,
  className = '',
}) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {(actionText && (actionTo || onAction)) && (
        <Button to={actionTo} onClick={onAction} variant="primary" size="md">
          {actionText}
        </Button>
      )}
    </div>
  );
}

