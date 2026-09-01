import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingCart, Search } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatPrice, formatDate, getOrderStatusColor } from '../../utils/helpers';
import { PageLoader } from '../../components/Loading/Loading';
import styles from '../Dashboard/Dashboard.module.css';

const STATUS_OPTS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        setLoading(true);
        const { data } = await orderService.getAll({ limit: 200 });
        setOrders(data || []);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query.trim()) return orders;
        const q = query.toLowerCase();
        return orders.filter(
            (o) =>
                o.id.toLowerCase().includes(q) ||
                o.profiles?.full_name?.toLowerCase().includes(q) ||
                o.profiles?.email?.toLowerCase().includes(q) ||
                o.status?.toLowerCase().includes(q)
        );
    }, [orders, query]);

    async function handleStatusChange(orderId, status) {
        if (!window.confirm(`Update order status to "${status}"?`)) return;
        await orderService.updateStatus(orderId, status);
        loadOrders();
    }

    if (loading) return <PageLoader />;

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Orders</h1>
            </div>

            <div className={styles.section}>
                <div className={styles.tableToolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search by ID, customer, or status…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search orders"
                        />
                    </div>
                    <span className={styles.resultCount}>
                        {filtered.length} of {orders.length}
                    </span>
                </div>

                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{order.profiles?.full_name || '—'}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                                            {order.profiles?.email}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{formatPrice(order.total)}</td>
                                    <td>
                                        <span className={`badge badge--${getOrderStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex gap-sm justify-end" style={{ alignItems: 'center' }}>
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="btn btn--icon btn--sm btn--ghost"
                                                aria-label="View order details"
                                                title="View details"
                                            >
                                                <Eye size={15} />
                                            </Link>
                                            <select
                                                className="form-select"
                                                style={{ padding: '5px 24px 5px 10px', fontSize: 'var(--text-xs)', width: 'auto' }}
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                aria-label="Change order status"
                                            >
                                                {STATUS_OPTS.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <ShoppingCart size={48} className={styles.emptyIcon} />
                            <div className={styles.emptyTitle}>
                                {query ? 'No orders match your search' : 'No orders yet'}
                            </div>
                            <p className={styles.emptyDesc}>
                                {query ? 'Try a different search term.' : 'Orders will appear here once customers purchase.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
