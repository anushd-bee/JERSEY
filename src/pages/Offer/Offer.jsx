import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Tag, Search, X, ArrowUpDown } from 'lucide-react';
import { productService } from '../../services/productService';
import ProductCard from '../../components/ProductCard/ProductCard';
import { ProductSkeleton } from '../../components/Loading/Loading';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './Offer.module.css';

const SORT_OPTIONS = [
    { value: '', label: 'Newest First' },
    { value: 'price:asc', label: 'Price: Low → High' },
    { value: 'price:desc', label: 'Price: High → Low' },
    { value: 'name:asc', label: 'Name: A → Z' },
];

export default function Offer() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState('');
    const pageRef = useRef(null);
    useScrollReveal(pageRef);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const { data } = await productService.getOffers({ sort, search: searchQuery });
                setProducts(data || []);
            } catch (err) {
                console.error('Error loading offers:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [sort, searchQuery]);

    return (
        <div className={styles.page} ref={pageRef}>
            {/* ── Page header ─────────────────────────────── */}
            <header className={`${styles.header} reveal`}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <ChevronRight size={13} aria-hidden="true" />
                    <span className={styles.breadcrumbActive}>Offer</span>
                </nav>

                <div className={styles.headerRow}>
                    <div>
                        <div className={styles.badgeRow}>
                            <span className={styles.saleBadge}>
                                <Tag size={12} strokeWidth={2.5} />
                                Sale
                            </span>
                        </div>
                        <h1 className={styles.title}>Offers</h1>
                        <p className={styles.subtitle}>Exclusive deals on premium jerseys — limited time only.</p>
                    </div>
                    {!loading && (
                        <p className={styles.resultCount}>
                            {products.length} <span>deals</span>
                        </p>
                    )}
                </div>
            </header>

            {/* ── Toolbar ─────────────────────────────────── */}
            <div className={`${styles.toolbar} reveal`}>
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        id="offer-search"
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search offers…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        aria-label="Search offers"
                    />
                    {searchQuery && (
                        <button
                            className={styles.searchClear}
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div className={styles.sortWrapper}>
                    <ArrowUpDown size={14} className={styles.sortIcon} />
                    <select
                        id="offer-sort"
                        className={styles.sortSelect}
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        aria-label="Sort offers"
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Product grid ── */}
            <main className={styles.main}>
                {loading ? (
                    <ProductSkeleton count={8} />
                ) : products.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🏷️</div>
                        <h2 className={styles.emptyTitle}>No offers available right now.</h2>
                        <p className={styles.emptyDesc}>
                            Check back soon — new deals are added regularly.
                        </p>
                        <Link to="/shop" className={styles.emptyBtn}>
                            Browse All Jerseys
                        </Link>
                    </div>
                ) : (
                    <div className={`${styles.grid} stagger-children`}>
                        {products.map(product => (
                            <div key={product.id} className="reveal">
                                <ProductCard product={product} showOfferBadge />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
