import React, { useState, useEffect } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ProductGallery.module.css';

export default function ProductGallery({
  images = [],
  productName = 'Produit FARÉL',
  badges = [],
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Normalize image list
  const imageList = images.length > 0
    ? images.map((img, idx) => (typeof img === 'string' ? { id: idx, image: img, alt: productName } : img))
    : [{ id: 0, image: '', alt: productName }];

  const currentImage = imageList[selectedIndex] || imageList[0];

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
      if (isLightboxOpen) {
        if (e.key === 'ArrowRight') {
          setSelectedIndex((prev) => (prev + 1) % imageList.length);
        } else if (e.key === 'ArrowLeft') {
          setSelectedIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, imageList.length]);

  return (
    <div className={styles.galleryWrapper}>
      {/* Main Viewport Image with Zoom Trigger */}
      <div
        className={styles.mainViewport}
        onClick={() => setIsLightboxOpen(true)}
        title="Cliquer pour agrandir en plein écran"
      >
        {badges && badges.length > 0 && (
          <div className={styles.badgeOverlay}>
            {badges.map((b, i) => (
              <span key={i} className={b.className}>
                {b.text}
              </span>
            ))}
          </div>
        )}

        <img
          src={currentImage.image}
          alt={currentImage.alt || productName}
          className={styles.mainImage}
        />

        <div className={styles.zoomHint}>
          <ZoomIn size={14} />
          <span>Zoom Plein Écran</span>
        </div>
      </div>

      {/* Thumbnails Row */}
      {imageList.length > 1 && (
        <div className={styles.thumbnailRow} role="tablist" aria-label="Galerie de photos">
          {imageList.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              role="tab"
              aria-selected={selectedIndex === idx}
              className={`${styles.thumbBtn} ${selectedIndex === idx ? styles.thumbActive : ''}`}
              onClick={() => setSelectedIndex(idx)}
              aria-label={`Photo ${idx + 1}`}
            >
              <img
                src={img.image}
                alt={img.alt || `${productName} ${idx + 1}`}
                className={styles.thumbImg}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className={styles.lightboxBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLightboxOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.lightboxContent}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={20} />
              <span>Fermer (Échap)</span>
            </button>

            <img
              src={currentImage.image}
              alt={currentImage.alt || productName}
              className={styles.lightboxImage}
            />

            <span className={styles.lightboxCaption}>
              {productName} — Photo {selectedIndex + 1} sur {imageList.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
