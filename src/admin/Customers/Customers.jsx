import { useEffect, useState, useMemo } from 'react';
import { Edit2, Users, Search } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/Loading/Loading';
import { formatDate } from '../../utils/helpers';
import RoleModal from './RoleModal';
import styles from '../Dashboard/Dashboard.module.css';

export default function AdminCustomers() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        setLoading(true);
        const { data } = await customerService.getAll();
        setCustomers(data || []);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query.trim()) return customers;
        const q = query.toLowerCase();
        return customers.filter(
            (c) =>
                c.full_name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.role?.toLowerCase().includes(q)
        );
    }, [customers, query]);

    function openRoleModal(customer) {
        setEditingCustomer(customer);
        setRoleModalOpen(true);
    }

    function closeRoleModal() {
        setRoleModalOpen(false);
        setEditingCustomer(null);
    }

    if (loading) return <PageLoader />;

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Customers</h1>
            </div>

            <div className={styles.section}>
                <div className={styles.tableToolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search by name, email, or role…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search customers"
                        />
                    </div>
                    <span className={styles.resultCount}>
                        {filtered.length} of {customers.length}
                    </span>
                </div>

                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((customer) => {
                                const isSelf = customer.id === user?.id;
                                return (
                                    <tr key={customer.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                {/* Avatar */}
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: '50%',
                                                    background: customer.role === 'admin' ? 'var(--accent-light)' : 'var(--background)',
                                                    color: customer.role === 'admin' ? 'var(--accent)' : 'var(--muted)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: 'var(--text-xs)',
                                                    border: '1px solid var(--border)', flexShrink: 0,
                                                }}>
                                                    {(customer.full_name?.[0] || customer.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                                                        {customer.full_name || '—'}
                                                        {isSelf && (
                                                            <span style={{
                                                                marginLeft: 6, fontSize: 'var(--text-xs)',
                                                                color: 'var(--muted)', fontWeight: 400,
                                                            }}>(you)</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                                                        {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge--${customer.role === 'admin' ? 'accent' : 'default'}`}>
                                                {customer.role || 'user'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
                                            {formatDate(customer.created_at)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                aria-label={isSelf ? 'Cannot change your own role' : 'Edit role'}
                                                title={isSelf ? 'You cannot change your own role' : 'Edit role'}
                                                onClick={() => !isSelf && openRoleModal(customer)}
                                                disabled={isSelf}
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <Users size={48} className={styles.emptyIcon} />
                            <div className={styles.emptyTitle}>
                                {query ? 'No customers match your search' : 'No customers yet'}
                            </div>
                            <p className={styles.emptyDesc}>
                                {query ? 'Try a different search term.' : 'Customers will appear here after they register.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <RoleModal
                isOpen={roleModalOpen}
                onClose={closeRoleModal}
                customer={editingCustomer}
                onSuccess={loadCustomers}
            />
        </>
    );
}
