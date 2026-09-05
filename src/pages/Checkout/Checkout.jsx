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
        ctx: { user },
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

            // Stage 1: Insert DB order record with pending state
            const orderData = {
                user_id: user.id,
                status: 'pending',
                total: grandTotal,
                subtotal: totalPrice,
                shipping_amount: shipping,
                tax_amount: 0,
                discount_amount: 0,
                shipping_address: formData,
                payment_method: 'razorpay',
            };

            const { data: order, error } = await orderService.create(orderData);
            if (error) throw error;

            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
            }));

            const { error: itemsError } = await orderService.createOrderItems(orderItems);
            if (itemsError) throw itemsError;

            // Setup Razorpay checkout options object
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummyKeyConfig',
                amount: grandTotal * 100, // in paisa
                currency: 'INR',
                name: 'JerseyStore',
                description: `Order Payment for #${order.id.slice(0, 8).toUpperCase()}`,
                image: '/favicon.ico',
                handler: async function (response) {
                    try {
                        // Success payment handler
                        await orderService.updateStatus(order.id, 'confirmed');
                        setSuccessOrder(order);
                        setStep(2);
                        clearCart();
                    } catch (err) {
                        console.error('Trigger error on updating status:', err);
                        alert('Order created, but status update failed. Please contact support.');
                        navigate('/profile');
                    }
                },
                prefill: {
                    name: formData.fullName,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    order_id: order.id,
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
