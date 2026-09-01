import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDateTime, getOrderStatusColor } from '../../utils/helpers';
import { PageLoader } from '../../components/Loading/Loading';
import styles from './OrderDetail.module.css';
import dashStyles from '../Dashboard/Dashboard.module.css';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetail() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    async function loadOrder() {
        setLoading(true);
        const { data } = await orderService.getById(orderId);
        setOrder(data || null);
        setLoading(false);
    }

    async function handleStatusChange(e) {
        const newStatus = e.target.value;
        if (!window.confirm(`Update order status to "${newStatus}"?`)) return;
        setStatusUpdating(true);
        const { data } = await orderService.updateStatus(orderId, newStatus);
        if (data) setOrder(prev => ({ ...prev, status: data.status }));
        setStatusUpdating(false);
    }

    if (loading) return <PageLoader />;
    if (!order) return (
        <div className={dashStyles.pageHeader}>
            <p style={{ color: 'var(--muted)' }}>Order not found.</p>
            <Link to="/admin/orders" className="btn btn--ghost">
                <ArrowLeft size={16} /> Back to Orders
            </Link>
        </div>
    );

    const shipping = order.shipping_address || {};

    return (
        <>
            {/* Header */}
            <div className={dashStyles.pageHeader}>
                <div className={styles.titleGroup}>
                    <Link to="/admin/orders" className={styles.backLink}>
                        <ArrowLeft size={16} /> Back to Orders
                    </Link>
                    <h1 className={dashStyles.pageTitle}>
                        Order <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                    </h1>
                </div>

                <div className={styles.statusControl}>
                    <span className={`badge badge--${getOrderStatusColor(order.status)}`}>
                        {order.status}
                    </span>
                    <select
                        className="form-select"
                        value={order.status}
                        onChange={handleStatusChange}
                        disabled={statusUpdating}
                        style={{ width: 'auto', display: 'inline-block' }}
                        aria-label="Change order status"
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Order Items */}
                <div className={`${dashStyles.section} ${styles.itemsSection}`}>
                    <div className={dashStyles.sectionHeader}>
                        <h2 className={dashStyles.sectionTitle}>
                            Items ({order.order_items?.length ?? 0})
                        </h2>
                        <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                    </div>
                    <div className="table-wrapper" style={{ border: 'none' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Size</th>
                                    <th>Qty</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order.order_items || []).map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles.productCell}>
                                                {item.products?.images?.[0] && (
                                                    <img
                                                        src={item.products.images[0]}
                                                        alt={item.products.name}
                                                        className={styles.productThumb}
                                                    />
                                                )}
                                                <span style={{ fontWeight: 500 }}>
                                                    {item.products?.name ?? '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {item.size
                                                ? <span className="badge badge--default">{item.size}</span>
                                                : '—'}
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {formatPrice(item.price * item.quantity)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar panels */}
                <div className={styles.sideStack}>
                    {/* Customer Info */}
                    <div className={dashStyles.section}>
                        <div className={dashStyles.sectionHeader}>
                            <h2 className={dashStyles.sectionTitle}>Customer</h2>
                        </div>
                        <div className={styles.infoBody}>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Name</span>
                                <span>{order.profiles?.full_name || '—'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Email</span>
                                <span style={{ wordBreak: 'break-all' }}>{order.profiles?.email || '—'}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span className={styles.infoLabel}>Ordered</span>
                                <span>{formatDateTime(order.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className={dashStyles.section}>
                        <div className={dashStyles.sectionHeader}>
                            <h2 className={dashStyles.sectionTitle}>Shipping Address</h2>
                        </div>
                        <div className={styles.infoBody}>
                            {Object.keys(shipping).length === 0 ? (
                                <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>No address provided.</p>
                            ) : (
                                <>
                                    {shipping.full_name && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Name</span>
                                            <span>{shipping.full_name}</span>
                                        </div>
                                    )}
                                    {shipping.phone && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Phone</span>
                                            <span>{shipping.phone}</span>
                                        </div>
                                    )}
                                    {(shipping.address || shipping.street) && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Street</span>
                                            <span>{shipping.address || shipping.street}</span>
                                        </div>
                                    )}
                                    {shipping.city && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>City</span>
                                            <span>{shipping.city}</span>
                                        </div>
                                    )}
                                    {shipping.state && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>State</span>
                                            <span>{shipping.state}</span>
                                        </div>
                                    )}
                                    {(shipping.pincode || shipping.zip || shipping.postal_code) && (
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Pincode</span>
                                            <span>{shipping.pincode || shipping.zip || shipping.postal_code}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
