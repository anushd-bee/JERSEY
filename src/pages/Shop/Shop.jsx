import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    SlidersHorizontal,
    ChevronRight,
    X,
    ArrowUpDown,
    Grid3x3,
    LayoutList,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import ProductCard from '../../components/ProductCard/ProductCard';
import { ProductSkeleton } from '../../components/Loading/Loading';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './Shop.module.css';

const SORT_OPTIONS = [
    { value: '', label: 'Newest First' },
    { value: 'price:asc', label: 'Price: Low → High' },
    { value: 'price:desc', label: 'Price: High → Low' },
    { value: 'name:asc', label: 'Name: A → Z' },
];

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [layout, setLayout] = useState('grid'); // 'grid' | 'list'
    const pageRef = useRef(null);
    useScrollReveal(pageRef);

    const activeCategory = searchParams.get('category') || '';
    const searchQuery = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || '';

    /* Derived: active filter count for badge */
    const activeFilterCount = [activeCategory, searchQuery, sort].filter(Boolean).length;

    useEffect(() => {
        categoryService.getAll().then(({ data }) => setCategories(data || []));
    }, []);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const { data } = await productService.getAll({
                    category: activeCategory,
                    search: searchQuery,
                    sort,
                });
                setProducts(data || []);
            } catch (err) {
                console.error('Error loading products:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [activeCategory, searchQuery, sort]);

    function setParam(key, value) {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
    }

    function clearAll() {
        setSearchParams({});
    }

    /* Lock body scroll when mobile filters open */
    useEffect(() => {
        document.body.style.overflow = mobileFiltersOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileFiltersOpen]);

    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Newest First';

    return (
        <div className={styles.page} ref={pageRef}>
            {/* ── Page header ───────────────────────────── */}
            <header className={`${styles.header} reveal`}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <ChevronRight size={13} aria-hidden="true" />
                    <span>Shop</span>
                    {activeCategory && (
                        <>
                            <ChevronRight size={13} aria-hidden="true" />
                            <span className={styles.breadcrumbActive}>
                                {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                            </span>
                        </>
                    )}
                </nav>
                <div className={styles.headerRow}>
                    <h1 className={styles.title}>
                        {activeCategory
                            ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Jerseys`
                            : 'All Jerseys'}
                    </h1>
                    {!loading && (
                        <p className={styles.resultCount}>
                            {products.length} <span>products</span>
                        </p>
                    )}
                </div>

                {/* ── Active filter chips ── */}
                {activeFilterCount > 0 && (
                    <div className={styles.activeFilters}>
                        {activeCategory && (
                            <button
                                className={styles.activeChip}
                                onClick={() => setParam('category', '')}
                            >
                                {activeCategory}
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        )}
                        {searchQuery && (
                            <button
                                className={styles.activeChip}
                                onClick={() => setParam('q', '')}
                            >
                                &ldquo;{searchQuery}&rdquo;
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        )}
                        {sort && (
                            <button
                                className={styles.activeChip}
                                onClick={() => setParam('sort', '')}
                            >
                                {currentSortLabel}
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        )}
                        <button className={styles.clearAll} onClick={clearAll}>
                            Clear all
                        </button>
                    </div>
                )}
            </header>

            {/* ── Toolbar ──────────────────────────────────── */}
            <div className={`${styles.toolbar} reveal`}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        id="shop-search"
                        type="search"
                        className={styles.searchInput}
                        placeholder="Search jerseys…"
                        value={searchQuery}
                        onChange={e => setParam('q', e.target.value)}
                        aria-label="Search products"
                    />
                    {searchQuery && (
                        <button
                            className={styles.searchClear}
                            onClick={() => setParam('q', '')}
                            aria-label="Clear search"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                    )}
                </div>

                <div className={styles.toolbarRight}>
                    {/* Sort (desktop custom select) */}
                    <div className={styles.sortWrapper}>
                        <ArrowUpDown size={14} className={styles.sortIcon} />
                        <select
                            id="shop-sort"
                            className={styles.sortSelect}
                            value={sort}
                            onChange={e => setParam('sort', e.target.value)}
                            aria-label="Sort products"
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Layout toggle */}
                    <div className={styles.layoutToggle} role="group" aria-label="Grid layout">
                        <button
                            className={`${styles.layoutBtn} ${layout === 'grid' ? styles.layoutBtnActive : ''}`}
                            onClick={() => setLayout('grid')}
                            aria-label="Grid view"
                            aria-pressed={layout === 'grid'}
                        >
                            <Grid3x3 size={16} strokeWidth={1.8} />
                        </button>
                        <button
                            className={`${styles.layoutBtn} ${layout === 'list' ? styles.layoutBtnActive : ''}`}
                            onClick={() => setLayout('list')}
                            aria-label="List view"
                            aria-pressed={layout === 'list'}
                        >
                            <LayoutList size={16} strokeWidth={1.8} />
                        </button>
                    </div>

                    {/* Mobile filter toggle */}
                    <button
                        id="shop-filter-toggle"
                        className={`${styles.filterToggle} ${activeFilterCount > 0 ? styles.filterToggleActive : ''}`}
                        onClick={() => setMobileFiltersOpen(true)}
                        aria-expanded={mobileFiltersOpen}
                        aria-controls="shop-mobile-filters"
                    >
                        <SlidersHorizontal size={16} strokeWidth={1.8} />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className={styles.filterBadge}>{activeFilterCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Layout ────────────────────────────────── */}
            <div className={styles.layout}>
                {/* ── Desktop Sidebar ── */}
                <aside className={styles.sidebar} aria-label="Filters">
                    <FilterPanel
                        categories={categories}
                        activeCategory={activeCategory}
                        setParam={setParam}
                        sort={sort}
                        onClearAll={clearAll}
                        activeFilterCount={activeFilterCount}
                    />
                </aside>

                {/* ── Product grid ── */}
                <main>
                    {loading ? (
                        <ProductSkeleton count={8} />
                    ) : products.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h2 className={styles.emptyTitle}>No jerseys found</h2>
                            <p className={styles.emptyDesc}>
                                Try adjusting your filters or search term.
                            </p>
                            <button className={styles.emptyReset} onClick={clearAll}>
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className={`${styles.grid} ${layout === 'list' ? styles.gridList : ''} stagger-children`}>
                            {products.map(product => (
                                <div key={product.id} className="reveal">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ── Mobile filter bottom sheet ── */}
            {mobileFiltersOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setMobileFiltersOpen(false)}
                    role="presentation"
                >
                    <div
                        id="shop-mobile-filters"
                        className={styles.mobileSheet}
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter products"
                    >
                        <div className={styles.mobileSheetHeader}>
                            <h2 className={styles.mobileSheetTitle}>Filters</h2>
                            <button
                                className={styles.mobileSheetClose}
                                onClick={() => setMobileFiltersOpen(false)}
                                aria-label="Close filters"
                            >
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>
                        <div className={styles.mobileSheetBody}>
                            <FilterPanel
                                categories={categories}
                                activeCategory={activeCategory}
                                setParam={setParam}
                                sort={sort}
                                onClearAll={clearAll}
                                activeFilterCount={activeFilterCount}
                                onApply={() => setMobileFiltersOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Reusable FilterPanel ─────────────────────────────── */
function FilterPanel({ categories, activeCategory, setParam, sort, onClearAll, activeFilterCount, onApply }) {
    return (
        <div className={styles.filterPanel}>
            {/* Category heading */}
            <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Category</span>
                <div className={styles.chipList}>
                    <button
                        className={`${styles.chip} ${!activeCategory ? styles.chipActive : ''}`}
                        onClick={() => setParam('category', '')}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.chip} ${activeCategory === cat.slug ? styles.chipActive : ''}`}
                            onClick={() => setParam('category', cat.slug)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort (sidebar version shown on mobile sheet) */}
            <div className={`${styles.filterGroup} ${styles.filterGroupSort}`}>
                <span className={styles.filterLabel}>Sort By</span>
                <div className={styles.chipList}>
                    {SORT_OPTIONS.map(o => (
                        <button
                            key={o.value}
                            className={`${styles.chip} ${sort === o.value ? styles.chipActive : ''}`}
                            onClick={() => setParam('sort', o.value)}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className={styles.filterActions}>
                {activeFilterCount > 0 && (
                    <button className={styles.clearAllBtn} onClick={onClearAll}>
                        Clear all ({activeFilterCount})
                    </button>
                )}
                {onApply && (
                    <button className={styles.applyBtn} onClick={onApply}>
                        Show Results
                    </button>
                )}
            </div>
        </div>
    );
}
