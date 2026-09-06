import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, ArrowRight, ShieldCheck, ShoppingBag, Truck, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/helpers';
import styles from './Checkout.module.css';

const checkoutSchema = z.object({
    fullName: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    address: z.string().min(5, 'Specific build layout or street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit postal code'),
});

function loadRazorpayScript() {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function Checkout() {
    const navigate = useNavigate();
    const { items, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const { settings } = useStoreSettings();
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1); // 1: Shipping, 2: Complete/Status
    const [successOrder, setSuccessOrder] = useState(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm({
        resolver: zodResolver(checkoutSchema),
        mode: 'onChange',
        defaultValues: {
            email: user?.email || '',
            phone: user?.phone || '',
            fullName: user?.full_name || '',
            address: user?.address || '',
        },
    });

    const shippingThreshold = settings.free_shipping_threshold;
    const baseShipping = settings.shipping_fee;
    const shipping = (settings.free_shipping_enabled && totalPrice >= shippingThreshold) ? 0 : baseShipping;
    const grandTotal = totalPrice + shipping;

    async function handlePaymentAndOrder(formData) {
        if (!user) {
            navigate('/login');
            return;
        }

        setSubmitting(true);
        try {
            // Load Razorpay
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                alert('Failing to load Razorpay payment SDK. Check connection.');
                setSubmitting(false);
                return;
            }

            // Stage 1: Ask the server to create the order. Prices, shipping,
            // tax and the Razorpay order itself are all computed server-side
            // from the real product data — we never send our own totals.
            const { data: secureOrder, error } = await orderService.createSecureOrder({
                items,
                shipping_address: formData,
            });
            if (error || secureOrder?.error) {
                throw new Error(secureOrder?.error || error.message || 'Failed to create order');
            }

            const { db_order_id, razorpay_order_id, amount, currency, key_id } = secureOrder;

            // Setup Razorpay checkout options object using the SERVER-issued amount/order id
            const options = {
                key: key_id,
                amount,
                currency,
                order_id: razorpay_order_id,
                name: 'JerseyStore',
                description: `Order Payment for #${db_order_id.slice(0, 8).toUpperCase()}`,
                image: '/favicon.ico',
                handler: async function (response) {
                    try {
                        // Success handler: verify the signature server-side before
                        // treating the payment as real. The order is only marked
                        // 'confirmed' inside the edge function, after verification.
                        const { data: verifyResult, error: verifyError } = await orderService.verifyPayment({
                            db_order_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (verifyError || verifyResult?.error) {
                            throw new Error(verifyResult?.error || verifyError.message || 'Verification failed');
                        }
                        setSuccessOrder(verifyResult.order || { id: db_order_id });
                        setStep(2);
                        clearCart();
                    } catch (err) {
                        console.error('Payment verification failed:', err);
                        alert('We could not verify your payment. If money was deducted, contact support with your order reference.');
                        navigate('/profile');
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    order_id: db_order_id,
                },
                theme: {
                    color: '#0A0A0A',
                },
                modal: {
                    ondismiss: function () {
                        // User closed the modal before paying
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            // Listen for payment failure to provide high quality feedback
            rzp.on('payment.failed', function (response) {
                alert('Payment transaction failed. Reason: ' + response.error.description);
                setSubmitting(false);
            });

            rzp.open();
        } catch (err) {
            console.error('Checkout creation error details:', err);
            alert('Checkout initialization failed. Please try again.');
            setSubmitting(false);
        }
    }

    if (items.length === 0 && step === 1) {
        navigate('/cart');
        return null;
    }

    if (step === 2) {
        return (
            <div className={styles.page}>
                <div className={styles.successWrapper}>
                    <div className={styles.successIconBox}>
                        <Check size={36} strokeWidth={3} />
                    </div>
                    <h1 className={styles.successTitle}>Order Confirmed!</h1>
                    <p className={styles.successDesc}>
                        Thank you for shopping. Your payment was verified, and your order{' '}
                        <strong>#{successOrder?.id.slice(0, 8).toUpperCase()}</strong> has been successfully placed.
                    </p>
                    <div className={styles.successActions}>
                        <Link to="/profile" className={styles.successBtn}>
                            View My Orders
                        </Link>
                        <Link to="/shop" className={styles.successBtnOutline}>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Secure Checkout</h1>
            </div>

            <form onSubmit={handleSubmit(handlePaymentAndOrder)} className={styles.formContainer}>
                <div className={styles.layout}>

                    {/* Shipping Form */}
                    <div className={styles.formPanel}>
                        <h2 className={styles.panelTitle}>Shipping Address</h2>
                        <div className={styles.formGrid}>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Full Name</label>
                                <input
                                    {...register('fullName')}
                                    className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                                    placeholder="Enter your first & last name"
                                />
                                {errors.fullName && (
                                    <span className={styles.errorText}>{errors.fullName.message}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                                    placeholder="you@email.com"
                                />
                                {errors.email && (
                                    <span className={styles.errorText}>{errors.email.message}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Phone Number</label>
                                <input
                                    {...register('phone')}
                                    type="tel"
                                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                                    placeholder="10-digit mobile"
                                />
                                {errors.phone && (
                                    <span className={styles.errorText}>{errors.phone.message}</span>
                                )}
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Address Line</label>
                                <textarea
                                    {...register('address')}
                                    className={`${styles.textarea} ${errors.address ? styles.inputError : ''}`}
                                    placeholder="Apartment, suite, block unit, street address details"
                                    rows={3}
                                />
                                {errors.address && (
                                    <span className={styles.errorText}>{errors.address.message}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>City</label>
                                <input
                                    {...register('city')}
                                    className={`${styles.input} ${errors.city ? styles.inputError : ''}`}
                                    placeholder="e.g. Mumbai"
                                />
                                {errors.city && (
                                    <span className={styles.errorText}>{errors.city.message}</span>
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>State</label>
                                <input
                                    {...register('state')}
                                    className={`${styles.input} ${errors.state ? styles.inputError : ''}`}
                                    placeholder="e.g. Maharashtra"
                                />
                                {errors.state && (
                                    <span className={styles.errorText}>{errors.state.message}</span>
                                )}
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Pincode</label>
                                <input
                                    {...register('pincode')}
                                    className={`${styles.input} ${errors.pincode ? styles.inputError : ''}`}
                                    placeholder="6-digit PIN code"
                                />
                                {errors.pincode && (
                                    <span className={styles.errorText}>{errors.pincode.message}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order summary sidebar */}
                    <div className={styles.summaryPanel}>
                        <h3 className={styles.summaryTitle}>Review Items</h3>
                        <div className={styles.summaryList}>
                            {items.map((item) => (
                                <div key={`${item.id}-${item.size}`} className={styles.summaryItem}>
                                    <div className={styles.itemMainInfo}>
                                        <p className={styles.itemNameText}>{item.name}</p>
                                        <span className={styles.itemSpecs}>Size: {item.size} • Qty: {item.quantity}</span>
                                    </div>
                                    <span className={styles.itemSubprice}>
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.summaryDivider} />

                        <div className={styles.priceRow}>
                            <span>Subtotal</span>
                            <span>{formatPrice(totalPrice)}</span>
                        </div>
                        <div className={styles.priceRow}>
                            <span>Shipping</span>
                            <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                        </div>

                        <div className={styles.summaryDivider} />

                        <div className={styles.totalRow}>
                            <span>Total Due</span>
                            <span>{formatPrice(grandTotal)}</span>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={submitting || !isValid}
                        >
                            <CreditCard size={18} strokeWidth={2} />
                            {submitting ? 'Connecting Secure Gateway...' : `Proceed to Pay — ${formatPrice(grandTotal)}`}
                        </button>

                        <div className={styles.trustStrip}>
                            <ShieldCheck size={16} className={styles.trustIcon} />
                            <span>Payments secured by SSL encryption standards.</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
