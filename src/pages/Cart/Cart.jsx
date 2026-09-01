import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, RefreshCw, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/helpers';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './Cart.module.css';

export default function Cart() {
    const { items, totalPrice, totalItems, updateQuantity, removeItem, clearCart } = useCart();
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponError, setCouponError] = useState(false);
    const containerRef = useRef(null);

    useScrollReveal(containerRef);

    if (items.length === 0) {
        return (
            <div className={styles.page}>
                <div className={styles.empty}>
                    <ShoppingBag size={56} className={styles.emptyIcon} strokeWidth={1.5} />
                    <h2 className={styles.emptyTitle}>Your cart is empty</h2>
                    <p className={styles.emptyText}>
                        Gear up! Explore our latest authentic jersey drops and add them to your squad.
                    </p>
                    <Link to="/shop" className={styles.emptyBtn}>
                        Explore Shop
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </Link>
                </div>
            </div>
        );
    }

    const shippingThreshold = 999;
    const isFreeShipping = totalPrice >= shippingThreshold;
    const progressToFreeShipping = Math.min(100, (totalPrice / shippingThreshold) * 100);
    const amountNeededForFreeShipping = shippingThreshold - totalPrice;

    const baseShipping = 99;
    const shipping = isFreeShipping ? 0 : baseShipping;

    // UI-only coupon discount (10% off for sample "JERSEY10")
    const discount = couponApplied ? Math.round(totalPrice * 0.10) : 0;
    const grandTotal = totalPrice + shipping - discount;

    function applyCoupon(e) {
        e.preventDefault();
        if (couponCode.trim().toUpperCase() === 'JERSEY10') {
            setCouponApplied(true);
            setCouponError(false);
        } else {
            setCouponError(true);
            setCouponApplied(false);
        }
    }

    return (
        <div className={styles.page} ref={containerRef}>
            <div className={`${styles.header} reveal`}>
                <h1 className={styles.title}>
                    Shopping Cart <span>({totalItems})</span>
                </h1>
            </div>

            <div className={styles.layout}>
                {/* ── Cart Items list ────────────────── */}
                <div className={`${styles.items} reveal`}>

                    {/* Shipping Progress Thermometer */}
                    <div className={styles.shippingBar}>
                        <div className={styles.shippingBarHeader}>
                            <Truck size={16} className={isFreeShipping ? styles.iconGreen : styles.iconMuted} />
                            <span>
                                {isFreeShipping ? (
                                    <strong>Congratulations! You get free shipping.</strong>
                                ) : (
                                    <>
                                        Add <strong>{formatPrice(amountNeededForFreeShipping)}</strong> more for <strong>Free Shipping</strong>
                                    </>
                                )}
                            </span>
                        </div>
                        <div className={styles.progressBarBg}>
                            <div
                                className={`${styles.progressBarFill} ${isFreeShipping ? styles.progressGreen : ''}`}
                                style={{ width: `${progressToFreeShipping}%` }}
                            />
                        </div>
                    </div>

                    {/* Staggered Items list */}
                    <div className={styles.itemList}>
                        {items.map((item) => (
                            <article key={`${item.id}-${item.size}`} className={styles.item}>
                                <div className={styles.itemImage}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} loading="lazy" />
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <ShoppingBag size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className={styles.itemMain}>
                                    <div className={styles.itemHeader}>
                                        <Link to={`/product/${item.slug || item.id}`} className={styles.itemName}>
                                            {item.name}
                                        </Link>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.id, item.size)}
                                            aria-label={`Remove ${item.name} size ${item.size}`}
                                        >
                                            <Trash2 size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                    <p className={styles.itemSize}>Size: <strong>{item.size}</strong></p>

                                    <div className={styles.itemFooter}>
                                        {/* Qty control */}
                                        <div className={styles.qtyBox}>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                                aria-label="Decrease quantity"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={12} strokeWidth={2.5} />
                                            </button>
                                            <span className={styles.qtyVal}>{item.quantity}</span>
                                            <button
                                                className={styles.qtyBtn}
                                                onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                                aria-label="Increase quantity"
                                                disabled={item.quantity >= 10}
                                            >
                                                <Plus size={12} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        {/* Price block */}
                                        <div className={styles.itemPrices}>
                                            <span className={styles.itemTotal}>
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                            {item.quantity > 1 && (
                                                <span className={styles.itemUnit}>
                                                    {formatPrice(item.price)} each
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                {/* ── Summary & Outlay sidebar ────────────────── */}
                <div className={`${styles.sidebar} reveal`}>
                    <div className={styles.summaryBox}>
                        <h3 className={styles.summaryTitle}>Order Summary</h3>

                        <div className={styles.summaryDetails}>
                            <div className={styles.summaryRow}>
                                <span>Subtotal</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Shipping</span>
                                <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                            </div>

                            {couponApplied && (
                                <div className={`${styles.summaryRow} ${styles.summaryDiscountRow}`}>
                                    <span>Discount (10%)</span>
                                    <span>&minus;{formatPrice(discount)}</span>
                                </div>
                            )}

                            <div className={styles.summaryDivider} />

                            <div className={styles.summaryTotalRow}>
                                <span>Total</span>
                                <span>{formatPrice(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Checkout Trigger */}
                        <Link to="/checkout" className={styles.checkoutBtn}>
                            Proceed to Checkout
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </Link>

                        {/* Promo code field */}
                        <form className={styles.couponForm} onSubmit={applyCoupon}>
                            <input
                                type="text"
                                className={styles.couponInput}
                                placeholder="Promo Code ( try JERSEY10 )"
                                value={couponCode}
                                onChange={(e) => {
                                    setCouponCode(e.target.value);
                                    setCouponError(false);
                                }}
                                disabled={couponApplied}
                                aria-label="Enter coupon promo code"
                            />
                            <button
                                type="submit"
                                className={styles.couponBtn}
                                disabled={couponApplied || !couponCode.trim()}
                            >
                                Apply
                            </button>
                        </form>
                        {couponApplied && (
                            <p className={styles.couponSuccess}>✓ Code JERSEY10 applied successfully!</p>
                        )}
                        {couponError && (
                            <p className={styles.couponError}>✗ Invalid promo code.</p>
                        )}

                        <div className={styles.summaryDivider} />

                        {/* Secondary stats */}
                        <div className={styles.trustBanner}>
                            <div className={styles.trustItem}>
                                <ShieldCheck size={16} />
                                <span>Secure Razorpay checkout</span>
                            </div>
                            <div className={styles.trustItem}>
                                <RefreshCw size={16} />
                                <span>15-day return policy guarantee</span>
                            </div>
                        </div>

                        <button className={styles.clearCartBtn} onClick={clearCart}>
                            Clear Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
