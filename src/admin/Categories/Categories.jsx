import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, FolderTree, Search } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { PageLoader } from '../../components/Loading/Loading';
import CategoryFormModal from './CategoryFormModal';
import styles from '../Dashboard/Dashboard.module.css';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        setLoading(true);
        const { data } = await categoryService.getAll();
        setCategories(data || []);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query.trim()) return categories;
        const q = query.toLowerCase();
        return categories.filter(
            (c) => c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q)
        );
    }, [categories, query]);

    function openAdd() {
        setEditingCategory(null);
        setModalOpen(true);
    }

    function openEdit(category) {
        setEditingCategory(category);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingCategory(null);
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
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search categories"
                        />
                    </div>
                    <span className={styles.resultCount}>
                        {filtered.length} of {categories.length}
                    </span>
                </div>

                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((cat) => (
                                <tr key={cat.id}>
                                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
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
                                    <td style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
                                        {cat.description || '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn--icon btn--sm btn--ghost"
                                            aria-label="Edit category"
                                            onClick={() => openEdit(cat)}
                                        >
                                            <Edit2 size={15} />
                                        </button>
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
                                {query
                                    ? 'Try a different search term.'
                                    : 'Add a category to organise your products.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <CategoryFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                category={editingCategory}
                onSuccess={loadCategories}
            />
        </>
    );
}
