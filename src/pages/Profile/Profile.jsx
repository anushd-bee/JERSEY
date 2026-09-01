import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Package, Settings, ShoppingBag, ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDate, getOrderStatusColor } from '../../utils/helpers';
import { PageLoader } from '../../components/Loading/Loading';
import styles from './Profile.module.css';

export default function Profile() {
    const { user, profile, isAdmin, loading: authLoading, signOut, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (user) {
            loadOrders();
        }
    }, [user]);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                address: profile.address || '',
            });
        }
    }, [profile]);

    async function loadOrders() {
        try {
            const { data } = await orderService.getUserOrders(user.id);
            setOrders(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingOrders(false);
        }
    }

    async function handleSignOut() {
        await signOut();
        navigate('/');
    }

    async function handleSaveProfile(e) {
        e.preventDefault();
        await updateProfile(formData);
        alert('Profile updated!');
    }

    if (authLoading) return <PageLoader />;
    if (!user) return null;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.greeting}>
                        Hello, {profile?.full_name || 'there'}!
                    </h1>
                    <p className={styles.email}>{user.email}</p>
                </div>
                <button className={styles.signOutBtn} onClick={handleSignOut}>
                    <LogOut size={16} /> Sign Out
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'orders' ? styles.active : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <Package size={16} /> Orders
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'settings' ? styles.active : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={16} /> Settings
                </button>
                {isAdmin && (
                    <Link to="/admin" className={styles.tab} style={{ textDecoration: 'none' }}>
                        <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                )}
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className={styles.orders}>
                    {loadingOrders ? (
                        <PageLoader text="Loading orders..." />
                    ) : orders.length === 0 ? (
                        <div className={styles.empty}>
                            <ShoppingBag size={48} className={styles.emptyIcon} />
                            <h3 className={styles.emptyTitle}>No orders yet</h3>
                            <p>Start shopping to see your orders here.</p>
                            <Link to="/shop" className="btn btn--primary" style={{ marginTop: 16 }}>
                                Browse Shop <ArrowRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <span className={styles.orderId}>Order #{order.id.slice(0, 8)}</span>
                                    <span>{formatDate(order.created_at)}</span>
                                    <span className={`badge badge--${getOrderStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className={styles.orderItems}>
                                    {order.order_items?.map((item) => (
                                        <div key={item.id} className={styles.orderItem}>
                                            <div className={styles.orderItemImage}>
                                                {item.products?.images?.[0] && (
                                                    <img src={item.products.images[0]} alt={item.products.name} />
                                                )}
                                            </div>
                                            <span className={styles.orderItemName}>
                                                {item.products?.name} × {item.quantity}
                                                {item.size && ` (${item.size})`}
                                            </span>
                                            <span className={styles.orderItemPrice}>
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.orderFooter}>
                                    <span>Total</span>
                                    <span className={styles.orderTotal}>
                                        {formatPrice(order.total)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className={styles.profileForm}>
                    <form onSubmit={handleSaveProfile}>
                        <div className={styles.formGrid}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={formData.full_name || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, full_name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    className="form-input"
                                    value={formData.phone || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Address</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.address || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, address: e.target.value })
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                        <button type="submit" className={styles.saveBtn}>
                            Save Changes
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
