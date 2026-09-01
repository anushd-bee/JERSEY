import { useState, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import styles from './ProductGallery.module.css';

/**
 * Product image gallery with thumbnail strip.
 * Main image is displayed in a 1:1 white-background container
 * with object-fit: contain. Clicking thumbnails smoothly transitions.
 *
 * @param {string[]} images     - Array of image URLs
 * @param {string}   alt        - Alt text base
 * @param {number}   [discount] - Discount percentage badge (optional)
 */
export default function ProductGallery({ images = [], alt = 'Product', discount = 0 }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    const handleThumbnailClick = useCallback((index) => {
        if (index === activeIndex) return;
        setTransitioning(true);
        // Wait for fade-out, then swap
        setTimeout(() => {
            setActiveIndex(index);
            setTransitioning(false);
        }, 200);
    }, [activeIndex]);

    const LABELS = ['Primary', 'Front', 'Back', 'Side', 'Detail'];

    if (images.length === 0) {
        return (
            <div className={styles.gallery}>
                <div className={styles.mainWrapper}>
                    <div className={styles.placeholder}>
                        <ImageIcon size={64} strokeWidth={1} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.gallery}>
            {/* Main Image */}
            <div className={styles.mainWrapper}>
                <img
                    src={images[activeIndex]}
                    alt={`${alt} — ${LABELS[activeIndex] || `Image ${activeIndex + 1}`}`}
                    className={`${styles.mainImage} ${transitioning ? styles.mainImageFading : ''}`}
                    draggable={false}
                />
                {discount > 0 && (
                    <span className={styles.badgeSale}>
                        &minus;{discount}%
                    </span>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className={styles.thumbStrip} role="listbox" aria-label="Product thumbnails">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            className={`${styles.thumb} ${i === activeIndex ? styles.thumbActive : ''}`}
                            onClick={() => handleThumbnailClick(i)}
                            aria-selected={i === activeIndex}
                            role="option"
                            aria-label={LABELS[i] || `Image ${i + 1}`}
                        >
                            <img
                                src={img}
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                            />
                            {i === 0 && (
                                <span className={styles.thumbPrimaryBadge}>★</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
