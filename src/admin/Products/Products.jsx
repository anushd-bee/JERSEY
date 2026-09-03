import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { productService } from '../../services/productService';
import { formatPrice } from '../../utils/helpers';
import { PageLoader } from '../../components/Loading/Loading';
import ProductFormModal from './ProductFormModal';
import styles from '../Dashboard/Dashboard.module.css';

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoading(true);
        // Admin needs ALL products (active and inactive) — bypass the service's is_active filter
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .order('created_at', { ascending: false })
            .limit(200);
        if (error) console.error('Admin products fetch error:', error);
        setProducts(data || []);
        setLoading(false);
    }

    const filtered = useMemo(() => {
        if (!query.trim()) return products;
        const q = query.toLowerCase();
        return products.filter(
            (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.categories?.name?.toLowerCase().includes(q)
        );
    }, [products, query]);

    function openAdd() {
        setEditingProduct(null);
        setModalOpen(true);
    }

    function openEdit(product) {
        setEditingProduct(product);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditingProduct(null);
    }

    async function handleDelete(id) {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        await productService.delete(id);
        loadProducts();
    }

    if (loading) return <PageLoader />;

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Products</h1>
                <button className="btn btn--primary" onClick={openAdd}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className={styles.section}>
                {/* Toolbar */}
                <div className={styles.tableToolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={15} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Search products…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search products"
                        />
                    </div>
                    <span className={styles.resultCount}>
                        {filtered.length} of {products.length}
                    </span>
                </div>

                {/* Table */}
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Featured</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <div style={{
                                                width: 52, height: 52, borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden', background: '#ffffff',
                                                border: '1px solid var(--border)', flexShrink: 0,
                                            }}>
                                                {(product.images?.[0] || product.image) && (
                                                    <img
                                                        src={product.images?.[0] || product.image}
                                                        alt={product.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{product.name}</div>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                                                    {product.slug}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge--default">
                                            {product.categories?.name || '—'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{formatPrice(product.price)}</td>
                                    <td style={{ color: product.stock === 0 ? 'var(--danger)' : 'var(--text)' }}>
                                        {product.stock ?? '—'}
                                    </td>
                                    <td>
                                        <span className={`badge badge--${product.is_featured ? 'success' : 'default'}`}>
                                            {product.is_featured ? 'Featured' : 'Standard'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge--${product.is_active ? 'success' : 'default'}`}>
                                            {product.is_active ? 'Active' : 'Draft'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="flex gap-sm justify-end">
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                aria-label="Edit product"
                                                onClick={() => openEdit(product)}
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                className="btn btn--icon btn--sm btn--ghost"
                                                style={{ color: 'var(--danger)' }}
                                                onClick={() => handleDelete(product.id)}
                                                aria-label="Delete product"
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
                            <Package size={48} className={styles.emptyIcon} />
                            <div className={styles.emptyTitle}>
                                {query ? 'No products match your search' : 'No products yet'}
                            </div>
                            <p className={styles.emptyDesc}>
                                {query
                                    ? 'Try a different search term or clear the filter.'
                                    : 'Click "Add Product" to create your first product.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <ProductFormModal
                isOpen={modalOpen}
                onClose={closeModal}
                product={editingProduct}
                onSuccess={loadProducts}
            />
        </>
    );
}
