import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import styles from './ProductImage.module.css';

/**
 * Reusable product image component.
 * Enforces consistent 1:1 white-background catalog-style presentation.
 *
 * @param {string}   src         - Image URL
 * @param {string}   alt         - Alt text
 * @param {string}   [className] - Additional wrapper class
 * @param {boolean}  [square]    - Force 1:1 aspect ratio (default: true)
 * @param {boolean}  [hover]     - Enable subtle zoom on hover (default: false)
 * @param {string}   [size]      - 'sm' | 'md' | 'lg' | 'full' (presets, default: 'full')
 * @param {boolean}  [rounded]   - Use rounded corners (default: true)
 * @param {boolean}  [lazy]      - Lazy load (default: true)
 */
export default function ProductImage({
    src,
    alt = 'Product',
    className = '',
    square = true,
    hover = false,
    size = 'full',
    rounded = true,
    lazy = true,
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const wrapperClasses = [
        styles.container,
        square ? styles.square : '',
        hover ? styles.hoverZoom : '',
        rounded ? styles.rounded : '',
        size !== 'full' ? styles[`size_${size}`] : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (!src || error) {
        return (
            <div className={wrapperClasses}>
                <div className={styles.placeholder}>
                    <ImageIcon size={size === 'sm' ? 20 : 40} strokeWidth={1.5} />
                </div>
            </div>
        );
    }

    return (
        <div className={wrapperClasses}>
            {!loaded && <div className={styles.skeleton} />}
            <img
                src={src}
                alt={alt}
                className={`${styles.image} ${loaded ? styles.imageLoaded : ''}`}
                loading={lazy ? 'lazy' : 'eager'}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                draggable={false}
            />
        </div>
    );
}
