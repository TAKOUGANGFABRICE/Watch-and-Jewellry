import React from 'react';
import styles from './SkeletonCard.module.css';

export default function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.card}>
          <div className={`${styles.image} ${styles.shimmer}`} />
          <div className={styles.body}>
            <div className={`${styles.brand} ${styles.shimmer}`} />
            <div className={`${styles.title} ${styles.shimmer}`} />
            <div className={`${styles.price} ${styles.shimmer}`} />
          </div>
        </div>
      ))}
    </>
  );
}

