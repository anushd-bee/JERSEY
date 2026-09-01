import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ChevronRight,
    Heart,
    ShoppingBag,
    Minus,
    Plus,
    Truck,
    RotateCcw,
    Shield,
    Check,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice, SIZES } from '../../utils/helpers';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import ProductGallery from '../../components/ProductGallery/ProductGallery';
import { PageLoader } from '../../components/Loading/Loading';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './ProductDetails.module.css';

export default function ProductDetails() {
    const { slug } = useParams();
    const { addItem } = useCart();
    const { user } = useAuth();
    const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState('M');
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const [scrolledPast, setScrolledPast] = useState(false);

    const wishlisted = user && product && isWishlisted(product.id);
    const containerRef = useRef(null);
    const ctaTriggerRef = useRef(null);

    useScrollReveal(containerRef);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const { data, error } = await productService.getBySlug(slug);
                if (error) {
                    const { data: d2 } = await productService.getById(slug);
                    setProduct(d2);
                    if (d2?.category_id) {
                        const { data: rel } = await productService.getRelated(d2.id, d2.category_id);
                        setRelated(rel || []);
                    }
                } else {
                    setProduct(data);
                    if (data?.category_id) {
                        const { data: rel } = await productService.getRelated(data.id, data.category_id);
                        setRelated(rel || []);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                setQuantity(1);
            }
        }
        load();
        window.scrollTo(0, 0);
    }, [slug]);

    /* Handle intersection observer to show/hide sticky bottom buy-panel on mobile */
    useEffect(() => {
        if (!product || loading) return;
        const trigger = ctaTriggerRef.current;
        if (!trigger) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setScrolledPast(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, [product, loading]);

    if (loading) return <PageLoader text="Loading product details..." />;
    if (!product) {
        return (
            <div className={styles.notFoundPage}>
                <div className={styles.notFoundBox}>
                    <h2 className={styles.notFoundTitle}>Jersey Not Found</h2>
                    <p className={styles.notFoundDesc}>
                        The jersey variant you are looking for does not exist or has been removed.
                    </p>
                    <Link to="/shop" className={styles.notFoundBtn}>
                        Explore Shop
                    </Link>
                </div>
            </div>
        );
    }

    const images = product.images || (product.image ? [product.image] : []);
    const discountPercent =
        product.compare_price && product.compare_price > product.price
            ? Math.round(
                ((product.compare_price - product.price) / product.compare_price) * 100
            )
            : 0;

    function handleAddToCart() {
        addItem(product, selectedSize, quantity);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    }

    function handleWishlist() {
        if (!user) return;
        if (wishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
        }
    }

    return (
        <div className={styles.page} ref={containerRef}>
            {/* Breadcrumbs */}
            <div className={`${styles.breadcrumb} reveal`}>
                <Link to="/">Home</Link>
                <ChevronRight size={13} aria-hidden="true" />
                <Link to="/shop">Shop</Link>
                <ChevronRight size={13} aria-hidden="true" />
                <span className={styles.breadcrumbActive}>{product.name}</span>
            </div>

            {/* Layout Grid */}
            <div className={styles.layout}>
                {/* ── Gallery Panel ────────────────────── */}
                <div className={`${styles.gallery} reveal`}>
                    <ProductGallery
                        images={images}
                        alt={product.name}
                        discount={discountPercent}
                    />
                </div>

                {/* ── Information Panel ────────────────── */}
                <div className={`${styles.info} reveal`}>
                    {product.categories?.name && (
                        <span className={styles.category}>{product.categories.name}</span>
                    )}
                    <h1 className={styles.name}>{product.name}</h1>

                    {/* Price and highlights */}
                    <div className={styles.priceBlock}>
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                        {product.compare_price && product.compare_price > product.price && (
                            <>
                                <span className={styles.comparePrice}>
                                    {formatPrice(product.compare_price)}
                                </span>
                                <span className={styles.discountBadge}>
                                    {discountPercent}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className={styles.descBlock}>
                            <p className={styles.description}>{product.description}</p>
                        </div>
                    )}

                    <div className={styles.lineDivider} />

                    {/* Size Selector */}
                    <div className={styles.sectionContainer}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionTitle}>Select Size</span>
                            <span className={styles.selectedLabel}>{selectedSize}</span>
                        </div>
                        <div className={styles.sizes}>
                            {(product.sizes || SIZES).map(size => (
                                <button
                                    key={size}
                                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeActive : ''}`}
                                    onClick={() => setSelectedSize(size)}
                                    aria-pressed={selectedSize === size}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Picker */}
                    <div className={styles.sectionContainer}>
                        <span className={styles.sectionTitle}>Quantity</span>
                        <div className={styles.qtyPicker}>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                aria-label="Decrease quantity"
                                disabled={quantity <= 1}
                            >
                                <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <span className={styles.qtyVal}>{quantity}</span>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                                aria-label="Increase quantity"
                                disabled={quantity >= 10}
                            >
                                <Plus size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    {/* Add to Cart & Wishlist Trigger container */}
                    <div className={styles.ctaWrapper} ref={ctaTriggerRef}>
                        <button
                            className={`${styles.addToCart} ${added ? styles.addToCartAdded : ''}`}
                            onClick={handleAddToCart}
                            disabled={added}
                        >
                            {added ? (
                                <>
                                    <Check size={18} strokeWidth={2.5} />
                                    Added to Cart
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={18} strokeWidth={2} />
                                    Add to Cart
                                </>
                            )}
                        </button>
                        {user && (
                            <button
                                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlisted : ''}`}
                                onClick={handleWishlist}
                                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            >
                                <Heart
                                    size={20}
                                    strokeWidth={2}
                                    fill={wishlisted ? 'currentColor' : 'none'}
                                />
                            </button>
                        )}
                    </div>

                    <div className={styles.lineDivider} />

                    {/* Brand Promises */}
                    <div className={styles.promises}>
                        <div className={styles.promiseItem}>
                            <div className={styles.promiseIcon}>
                                <Truck size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.promiseText}>
                                <h6>Free shipping over ₹999</h6>
                                <p>Standard delivery within 3-5 business days</p>
                            </div>
                        </div>
                        <div className={styles.promiseItem}>
                            <div className={styles.promiseIcon}>
                                <RotateCcw size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.promiseText}>
                                <h6>15-day easy returns</h6>
                                <p>No questions asked return authorization</p>
                            </div>
                        </div>
                        <div className={styles.promiseItem}>
                            <div className={styles.promiseIcon}>
                                <Shield size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.promiseText}>
                                <h6>100% authentic product</h6>
                                <p>Verified sports merchandise direct supplier</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Related Jerseys ─────────────────────── */}
            {related.length > 0 && (
                <section className={`${styles.relatedSection} reveal`}>
                    <h2 className={styles.relatedTitle}>You May Also Like</h2>
                    <ProductGrid products={related} />
                </section>
            )}

            {/* ── Sticky Mobile/Tablet Buy Panel ─────── */}
            <div className={`${styles.stickyPanel} ${scrolledPast ? styles.stickyPanelVisible : ''}`}>
                <div className={styles.stickyPanelInner}>
                    <div className={styles.stickyLeft}>
                        <p className={styles.stickyName}>{product.name}</p>
                        <p className={styles.stickyPrice}>
                            {formatPrice(product.price)}
                            {product.compare_price > product.price && (
                                <span className={styles.stickyCompare}>
                                    {formatPrice(product.compare_price)}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        className={`${styles.stickyBtn} ${added ? styles.stickyBtnAdded : ''}`}
                        onClick={handleAddToCart}
                        disabled={added}
                    >
                        {added ? (
                            <>
                                <Check size={16} strokeWidth={2.5} />
                                Added!
                            </>
                        ) : (
                            <>
                                <ShoppingBag size={16} strokeWidth={2} />
                                Add ({selectedSize})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
