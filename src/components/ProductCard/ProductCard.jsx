import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Image as ImageIcon, Plus, Minus, X, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/helpers';
import styles from './ProductCard.module.css';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

/* ── Quick-Add Drawer ──────────────────────────────────────────── */
function QuickAddDrawer({ product, onClose }) {
    const { addItem } = useCart();
    const [selectedSize, setSelectedSize] = useState(null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    function handleAdd() {
        if (!selectedSize) return;
        addItem(product, selectedSize, qty);
        setAdded(true);
        setTimeout(() => {
            setAdded(false);
            onClose();
        }, 900);
    }

    return (
        /* Backdrop */
        <div
            className={styles.drawerBackdrop}
            onClick={onClose}
            role="presentation"
        >
            {/* Drawer panel */}
            <div
                className={styles.drawer}
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={`Quick add ${product.name}`}
            >
                {/* Header */}
                <div className={styles.drawerHeader}>
                    <div>
                        <p className={styles.drawerCategory}>
                            {product.categories?.name || 'Jersey'}
                        </p>
                        <h3 className={styles.drawerName}>{product.name}</h3>
                        <div className={styles.drawerPrice}>
                            <span className={styles.drawerPriceMain}>
                                {formatPrice(product.price)}
                            </span>
                            {product.compare_price > product.price && (
                                <span className={styles.drawerPriceOld}>
                                    {formatPrice(product.compare_price)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        className={styles.drawerClose}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Size picker */}
                <div className={styles.drawerSection}>
                    <div className={styles.drawerSectionLabel}>
                        Select Size
                        {!selectedSize && (
                            <span className={styles.drawerSizeHint}>— required</span>
                        )}
                    </div>
                    <div className={styles.sizeGrid}>
                        {SIZES.map(size => (
                            <button
                                key={size}
                                className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ''}`}
                                onClick={() => setSelectedSize(size)}
                                aria-pressed={selectedSize === size}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Qty */}
                <div className={styles.drawerSection}>
                    <div className={styles.drawerSectionLabel}>Quantity</div>
                    <div className={styles.qtyRow}>
                        <button
                            className={styles.qtyBtn}
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            aria-label="Decrease quantity"
                            disabled={qty <= 1}
                        >
                            <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className={styles.qtyNum}>{qty}</span>
                        <button
                            className={styles.qtyBtn}
                            onClick={() => setQty(q => Math.min(10, q + 1))}
                            aria-label="Increase quantity"
                            disabled={qty >= 10}
                        >
                            <Plus size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Add to cart */}
                <button
                    className={`${styles.drawerAddBtn} ${added ? styles.drawerAdded : ''} ${!selectedSize ? styles.drawerAddBtnDisabled : ''}`}
                    onClick={handleAdd}
                    disabled={!selectedSize || added}
                    aria-label="Add to cart"
                >
                    {added ? (
                        <>
                            <Check size={18} strokeWidth={2.5} />
                            Added to Cart!
                        </>
                    ) : (
                        <>
                            <ShoppingBag size={18} strokeWidth={2} />
                            {selectedSize ? `Add to Cart — ${selectedSize}` : 'Select a Size First'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ── Product Card ──────────────────────────────────────────────── */
export default function ProductCard({ product }) {
    const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
    const { user } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const wishlisted = user && isWishlisted(product.id);

    /* Support both images[] array and single image field */
    const images = product.images || (product.image ? [product.image] : []);
    const primaryImage = images[0];
    const secondaryImage = images[1]; // hover image if available

    const discountPct =
        product.compare_price && product.compare_price > product.price
            ? Math.round((1 - product.price / product.compare_price) * 100)
            : null;

    const isNew =
        product.created_at &&
        Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

    function handleWishlist(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;
        if (wishlisted) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product.id);
        }
    }

    function handleQuickAdd(e) {
        e.preventDefault();
        e.stopPropagation();
        setDrawerOpen(true);
    }

    return (
        <>
            <article className={styles.card}>
                {/* Invisible full-card link overlay (behind everything BUT actions) */}
                <Link
                    to={`/product/${product.slug || product.id}`}
                    className={styles.cardLink}
                    aria-label={`View ${product.name}`}
                    tabIndex={-1}
                />

                {/* ── Image area ── */}
                <div className={styles.imageWrap}>
                    {primaryImage ? (
                        <>
                            <img
                                src={primaryImage}
                                alt={product.name}
                                className={`${styles.img} ${secondaryImage ? styles.imgPrimary : ''}`}
                                loading="lazy"
                            />
                            {secondaryImage && (
                                <img
                                    src={secondaryImage}
                                    alt=""
                                    className={`${styles.img} ${styles.imgSecondary}`}
                                    loading="lazy"
                                    aria-hidden="true"
                                />
                            )}
                        </>
                    ) : (
                        <div className={styles.imgPlaceholder}>
                            <ImageIcon size={40} strokeWidth={1.5} />
                        </div>
                    )}

                    {/* ── Badges ── */}
                    <div className={styles.badges}>
                        {isNew && <span className={styles.badgeNew}>New</span>}
                        {discountPct && (
                            <span className={styles.badgeSale}>−{discountPct}%</span>
                        )}
                    </div>

                    {/* ── Floating actions (right side) ── */}
                    <div className={styles.actions}>
                        {user && (
                            <button
                                className={`${styles.actionBtn} ${wishlisted ? styles.actionBtnActive : ''}`}
                                onClick={handleWishlist}
                                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                tabIndex={0}
                            >
                                <Heart
                                    size={16}
                                    strokeWidth={2}
                                    fill={wishlisted ? 'currentColor' : 'none'}
                                />
                            </button>
                        )}
                    </div>

                    {/* ── Quick-add overlay (bottom) ── */}
                    <div className={styles.quickAddBar}>
                        <button
                            className={styles.quickAddBtn}
                            onClick={handleQuickAdd}
                            aria-label={`Quick add ${product.name} to cart`}
                            tabIndex={0}
                        >
                            <ShoppingBag size={15} strokeWidth={2} />
                            Quick Add
                        </button>
                    </div>
                </div>

                {/* ── Product info ── */}
                <div className={styles.info}>
                    {product.categories?.name && (
                        <span className={styles.category}>{product.categories.name}</span>
                    )}
                    <Link
                        to={`/product/${product.slug || product.id}`}
                        className={styles.nameLink}
                    >
                        <h3 className={styles.name}>{product.name}</h3>
                    </Link>
                    <div className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                        {discountPct && (
                            <span className={styles.comparePrice}>
                                {formatPrice(product.compare_price)}
                            </span>
                        )}
                    </div>
                </div>
            </article>

            {/* Quick-add drawer (portal-style, outside card) */}
            {drawerOpen && (
                <QuickAddDrawer
                    product={product}
                    onClose={() => setDrawerOpen(false)}
                />
            )}
        </>
    );
}
