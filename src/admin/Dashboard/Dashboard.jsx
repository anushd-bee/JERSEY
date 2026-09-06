import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Home,
    Package,
    ShoppingCart,
    Users,
    FolderTree,
    ArrowLeft,
    DollarSign,
    TrendingUp,
    Tag,
    UserCheck,
    LogOut,
    Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/Loading/Loading';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/helpers';
import styles from './Dashboard.module.css';

const sidebarLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/home', icon: Home, label: 'Home Page' },
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/customers', icon: Users, label: 'Customers' },
    { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { to: '/admin/settings', icon: Settings, label: 'Store Settings' },
];

function linkClass({ isActive }) {
    return `${styles.sidebarLink} ${isActive ? styles.active : ''}`;
}

function mobileLinkClass({ isActive }) {
    return `${styles.mobileNavLink} ${isActive ? styles.active : ''}`;
}

export function AdminLayout() {
    const { user, profile, isAdmin, loading, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            navigate('/');
        }
    }, [user, isAdmin, loading, navigate]);

    async function handleSignOut() {
        await signOut();
        navigate('/');
    }

    if (loading) return <PageLoader />;
    if (!isAdmin) return null;

    // Avatar initials
    const initials = profile?.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (user?.email?.[0] ?? 'A').toUpperCase();

    return (
        <div className={styles.layout}>
            {/* Sidebar (desktop) */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.sidebarTitle}>Admin Panel</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={linkClass}
                            end={link.end}
                        >
                            <link.icon size={17} />
                            {link.label}
                        </NavLink>
                    ))}

                    <div className={styles.sidebarDivider} />

                    <NavLink to="/" className={styles.sidebarLink}>
                        <ArrowLeft size={17} /> Back to Store
                    </NavLink>
                </nav>

                {/* User block */}
                <div className={styles.sidebarFooter}>
                    <div className={styles.sidebarUser}>
                        <div className={styles.sidebarAvatar}>{initials}</div>
                        <div className={styles.sidebarUserInfo}>
                            <div className={styles.sidebarUserName}>
                                {profile?.full_name || user?.email?.split('@')[0]}
                            </div>
                            <div className={styles.sidebarUserRole}>Administrator</div>
                        </div>
                        <button
                            className={styles.sidebarSignOut}
                            onClick={handleSignOut}
                            title="Sign out"
                            aria-label="Sign out"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile nav tabs */}
            <div className={styles.mobileNav}>
                {sidebarLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={mobileLinkClass}
                        end={link.end}
                    >
                        <link.icon size={13} />
                        {link.label}
                    </NavLink>
                ))}
            </div>

            {/* Main content */}
            <main className={styles.main}>
                <Outlet />
            </main>
        </div>
    );
}

/* ---- Dashboard Home ---- */
export default function DashboardHome() {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, customers: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                // Single SECURITY DEFINER RPC — bypasses RLS, always returns
                // accurate totals for orders, revenue, products, and customers.
                const { data: statsData, error: statsError } = await supabase
                    .rpc('get_admin_stats');

                if (statsError) throw statsError;

                setStats({
                    revenue: Number(statsData?.revenue ?? 0),
                    orders: Number(statsData?.orders ?? 0),
                    products: Number(statsData?.products ?? 0),
                    customers: Number(statsData?.customers ?? 0),
                });

                const { data: recent } = await supabase
                    .from('orders')
                    .select('*, profiles(full_name, email)')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setRecentOrders(recent || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    if (loading) return <PageLoader />;

    const statItems = [
        { key: 'revenue', label: 'Total Revenue', value: formatPrice(stats.revenue), icon: DollarSign, modifier: 'revenue' },
        { key: 'orders', label: 'Total Orders', value: stats.orders, icon: TrendingUp, modifier: 'orders' },
        { key: 'products', label: 'Products', value: stats.products, icon: Tag, modifier: 'products' },
        { key: 'customers', label: 'Customers', value: stats.customers, icon: UserCheck, modifier: 'customers' },
    ];

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                {statItems.map(({ key, label, value, icon: Icon, modifier }) => (
                    <div key={key} className={`${styles.statCard} ${styles[modifier]}`}>
                        <div className={styles.statIconWrap}>
                            <Icon size={20} />
                        </div>
                        <div className={styles.statValue}>{value}</div>
                        <div className={styles.statLabel}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Recent Orders</h2>
                    <NavLink to="/admin/orders" className="btn btn--sm btn--ghost">
                        View All →
                    </NavLink>
                </div>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td>{order.profiles?.full_name || order.profiles?.email || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{formatPrice(order.total)}</td>
                                    <td>
                                        <span className={`badge badge--${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 'var(--space-2xl)' }}>
                                        No orders yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
