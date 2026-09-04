import { useState, useCallback, useEffect } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
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
    const [failedImages, setFailedImages] = useState({});
    const [zoomOpen, setZoomOpen] = useState(false);

    const validImages = images.filter(image => image && !failedImages[image]);
    const imageKey = images.join('|');

    useEffect(() => {
        setActiveIndex(0);
        setFailedImages({});
    }, [imageKey]);

    useEffect(() => {
        if (activeIndex >= validImages.length) setActiveIndex(0);
    }, [activeIndex, validImages.length]);

    const handleThumbnailClick = useCallback((index) => {
        if (index === activeIndex) return;
        setTransitioning(true);
        // Wait for fade-out, then swap
        setTimeout(() => {
            setActiveIndex(index);
            setTransitioning(false);
        }, 200);
    }, [activeIndex]);

    const changeImage = useCallback((direction) => {
        setActiveIndex(index => (index + direction + validImages.length) % validImages.length);
    }, [validImages.length]);

    const LABELS = ['Primary', 'Front', 'Back', 'Side', 'Detail'];

    if (validImages.length === 0) {
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
                    src={validImages[activeIndex]}
                    alt={`${alt} — ${LABELS[activeIndex] || `Image ${activeIndex + 1}`}`}
                    className={`${styles.mainImage} ${transitioning ? styles.mainImageFading : ''}`}
                    draggable={false}
                    onError={() => setFailedImages(prev => ({ ...prev, [validImages[activeIndex]]: true }))}
                />
                {validImages.length > 1 && (
                    <>
                        <button className={`${styles.galleryControl} ${styles.galleryControlPrev}`} onClick={() => changeImage(-1)} aria-label="Previous product image">
                            <ChevronLeft size={20} />
                        </button>
                        <button className={`${styles.galleryControl} ${styles.galleryControlNext}`} onClick={() => changeImage(1)} aria-label="Next product image">
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
                <button className={styles.zoomButton} onClick={() => setZoomOpen(true)} aria-label="Zoom product image">
                    <Maximize2 size={17} />
                </button>
                {discount > 0 && (
                    <span className={styles.badgeSale}>
                        &minus;{discount}%
                    </span>
                )}
            </div>

            {/* Thumbnails */}
            {validImages.length > 1 && (
                <div className={styles.thumbStrip} role="listbox" aria-label="Product thumbnails">
                    {validImages.map((img, i) => (
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
                                onError={() => setFailedImages(prev => ({ ...prev, [img]: true }))}
                            />
                            {i === 0 && (
                                <span className={styles.thumbPrimaryBadge}>★</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {zoomOpen && (
                <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Product image zoom" onClick={() => setZoomOpen(false)}>
                    <button className={styles.lightboxClose} onClick={() => setZoomOpen(false)} aria-label="Close image zoom"><X size={22} /></button>
                    <img src={validImages[activeIndex]} alt={alt} className={styles.lightboxImage} onClick={event => event.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
