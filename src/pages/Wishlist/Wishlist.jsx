import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import styles from './Wishlist.module.css';

export default function Wishlist() {
    const { items } = useWishlist();
    const { user } = useAuth();

    if (!user) {
        return (
            <div className={styles.page}>
                <div className={styles.empty}>
                    <Heart size={64} className={styles.emptyIcon} />
                    <h2 className={styles.emptyTitle}>Sign in to view your wishlist</h2>
                    <p className={styles.emptyText}>
                        Create an account to save your favorite jerseys.
                    </p>
                    <Link to="/login" className="btn btn--primary">
                        Sign In <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>My Wishlist ({items.length})</h1>

            {items.length === 0 ? (
                <div className={styles.empty}>
                    <Heart size={64} className={styles.emptyIcon} />
                    <h2 className={styles.emptyTitle}>Your wishlist is empty</h2>
                    <p className={styles.emptyText}>
                        Browse our collection and save jerseys you love.
                    </p>
                    <Link to="/shop" className="btn btn--primary">
                        Browse Shop <ArrowRight size={18} />
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {items.map((item) =>
                        item.products ? (
                            <ProductCard key={item.id} product={item.products} />
                        ) : null
                    )}
                </div>
            )}
        </div>
    );
}
