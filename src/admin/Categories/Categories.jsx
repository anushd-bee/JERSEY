import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, FolderTree, Search, Trash2, EyeOff, Eye, AlertTriangle } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { PageLoader } from '../../components/Loading/Loading';
import CategoryFormModal from './CategoryFormModal';
import Modal from '../../components/Modal/Modal';
import styles from '../Dashboard/Dashboard.module.css';
import catStyles from './Categories.module.css';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null); // { cat, productCount }
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => { loadCategories(); }, []);

    async function loadCategories() {
        setLoading(true);
        const { data } = await categoryService.getAllWithCount();
        setCategories(data || []);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query.trim()) return categories;
        const q = query.toLowerCase();
        return categories.filter(
            c => c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q)
        );
    }, [categories, query]);

    function openAdd() { setEditingCategory(null); setModalOpen(true); }
    function openEdit(cat) { setEditingCategory(cat); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setEditingCategory(null); }

    async function tryDelete(cat) {
        setDeleteError('');
        setDeleteTarget({ cat, productCount: cat.product_count });
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        const { error, productCount } = await categoryService.delete(deleteTarget.cat.id);
        setDeleteLoading(false);
        if (error) {
            setDeleteError(error.message);
            setDeleteTarget(prev => ({ ...prev, productCount }));
            return;
        }
        setDeleteTarget(null);
        loadCategories();
    }

    async function handleDeactivate(cat) {
        await categoryService.deactivate(cat.id);
        setDeleteTarget(null);
        loadCategories();
    }

    async function toggleActive(cat) {
        await categoryService.update(cat.id, { is_active: !cat.is_active });
        loadCategories();
    }

    if (loading) return <PageLoader />;

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Categories</h1>
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} /> Add Category
                </button>
            </div>

            <div className={styles.section}>
                <div className={styles.tableToolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search categories…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            aria-label="Search categories"
                        />
                    </div>
                    <span className={styles.resultCount}>{filtered.length} of {categories.length}</span>
                </div>

                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Products</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(cat => (
                                <tr key={cat.id} style={{ opacity: cat.is_active ? 1 : 0.55 }}>
                                    {/* Name + thumbnail */}
                                    <td>
                                        <div className={catStyles.nameCell}>
                                            {cat.image && (
                                                <img src={cat.image} alt="" className={catStyles.catThumb} />
                                            )}
                                            <span style={{ fontWeight: 600 }}>{cat.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <code style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 'var(--text-xs)',
                                            background: 'var(--background)',
                                            border: '1px solid var(--border)',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-xs)',
                                        }}>
                                            {cat.slug}
                                        </code>
                                    </td>
                                    <td>
                                        <span className={catStyles.productBadge}>{cat.product_count}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${cat.is_active ? 'badge--success' : 'badge--default'}`}>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                title={cat.is_active ? 'Deactivate' : 'Activate'}
                                                onClick={() => toggleActive(cat)}
                                            >
                                                {cat.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                title="Edit"
                                                onClick={() => openEdit(cat)}
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                title="Delete"
                                                style={{ color: '#E63946' }}
                                                onClick={() => tryDelete(cat)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <div className={styles.emptyState}>
                            <FolderTree size={48} className={styles.emptyIcon} />
                            <div className={styles.emptyTitle}>
                                {query ? 'No categories match your search' : 'No categories yet'}
                            </div>
                            <p className={styles.emptyDesc}>
                                {query ? 'Try a different search term.' : 'Add a category to organise your products.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add / Edit modal */}
            <CategoryFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                category={editingCategory}
                onSuccess={loadCategories}
            />

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <Modal
                    isOpen={Boolean(deleteTarget)}
                    onClose={() => { setDeleteTarget(null); setDeleteError(''); }}
                    title="Delete Category"
                >
                    <div className="modal__body">
                        {deleteTarget.productCount > 0 ? (
                            <div className={catStyles.deleteWarning}>
                                <AlertTriangle size={22} strokeWidth={2} className={catStyles.deleteWarningIcon} />
                                <p>
                                    <strong>{deleteTarget.cat.name}</strong> contains{' '}
                                    <strong>{deleteTarget.productCount} product{deleteTarget.productCount !== 1 ? 's' : ''}</strong>.
                                    Please move or remove those products before deleting, or deactivate the category instead.
                                </p>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--color-text-2)', fontSize: 'var(--text-sm)' }}>
                                Permanently delete <strong>{deleteTarget.cat.name}</strong>? This cannot be undone.
                            </p>
                        )}
                        {deleteError && <div className="alert alert--danger mt-md">{deleteError}</div>}
                    </div>
                    <div className="modal__footer">
                        <button className="btn btn--ghost" onClick={() => { setDeleteTarget(null); setDeleteError(''); }}>
                            Cancel
                        </button>
                        {deleteTarget.productCount > 0 && (
                            <button
                                className="btn btn--warning"
                                onClick={() => handleDeactivate(deleteTarget.cat)}
                            >
                                <EyeOff size={15} /> Deactivate Instead
                            </button>
                        )}
                        <button
                            className="btn btn--danger"
                            disabled={deleteLoading || deleteTarget.productCount > 0}
                            onClick={confirmDelete}
                            title={deleteTarget.productCount > 0 ? 'Cannot delete a category with products' : ''}
                        >
                            {deleteLoading ? <span style={{ fontSize: '0.75rem' }}>Deleting…</span> : 'Delete'}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}
