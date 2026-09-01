import styles from './Loading.module.css';

export function PageLoader({ text = 'Loading...' }) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.spinner} />
            <span className={styles.text}>{text}</span>
        </div>
    );
}

export function ProductSkeleton({ count = 8 }) {
    return (
        <div className={styles.skeletonGrid}>
            {Array.from({ length: count }).map((_, i) => (
                <div className={styles.skeletonCard} key={i}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonInfo}>
                        <div className={styles.skeletonLineShort} />
                        <div className={styles.skeletonLineWide} />
                        <div className={styles.skeletonLine} style={{ width: '40%' }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default PageLoader;
