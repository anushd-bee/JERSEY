import { ShoppingBag } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, emptyMessage = 'No products found' }) {
    if (!products || products.length === 0) {
        return (
            <div className={styles.grid}>
                <div className={styles.empty}>
                    <ShoppingBag size={48} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>{emptyMessage}</h3>
                    <p>Try adjusting your filters or check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
