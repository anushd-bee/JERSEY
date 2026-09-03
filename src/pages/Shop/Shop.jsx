import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    X,
    ArrowUpDown,
    Grid3x3,
    LayoutList,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    ImageOff,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import ProductCard from '../../components/ProductCard/ProductCard';
import { ProductSkeleton } from '../../components/Loading/Loading';
import useScrollReveal from '../../hooks/useScrollReveal';
import styles from './Shop.module.css';

/* ── Constants ──────────────────────────────────────── */

const SORT_OPTIONS = [
    { value: '', label: 'Newest First' },
    { value: 'price:asc', label: 'Price: Low → High' },
    { value: 'price:desc', label: 'Price: High → Low' },
    { value: 'name:asc', label: 'Name: A → Z' },
];

// Fallback visual config for categories without a custom image
const CAT_FALLBACKS = {
    half_sleeve: { gradient: 'linear-gradient(145deg,#1a1a1a,#2d2d2d)', accent: '#E63946', icon: '👕' },
    full_sleeve: { gradient: 'linear-gradient(145deg,#0f0f1a,#1e1e3a)', accent: '#6366f1', icon: '🧥' },
    sleeveless: { gradient: 'linear-gradient(145deg,#1a0a00,#3d1a00)', accent: '#f59e0b', icon: '🎽' },
    zipper_tshirt: { gradient: 'linear-gradient(145deg,#001a0f,#003d22)', accent: '#10b981', icon: '🤐' },
    oversized: { gradient: 'linear-gradient(145deg,#1a001a,#3d003d)', accent: '#a855f7', icon: '🏙️' },
    kids: { gradient: 'linear-gradient(145deg,#001a1a,#003d3d)', accent: '#06b6d4', icon: '⚽' },
    old_gen: { gradient: 'linear-gradient(145deg,#1a1200,#3d2d00)', accent: '#d97706', icon: '🏆' },
    new_gen: { gradient: 'linear-gradient(145deg,#0a001a,#1a0038)', accent: '#E63946', icon: '⚡' },
    _default: { gradient: 'linear-gradient(145deg,#111,#222)', accent: '#E63946', icon: '👗' },
};

function getFallback(slug) {
    return CAT_FALLBACKS[slug] || CAT_FALLBACKS._default;
}

/* ── Main Shop component ────────────────────────────── */

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [catsLoading, setCatsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
    const [layout, setLayout] = useState('grid');
    const pageRef = useRef(null);
    useScrollReveal(pageRef);

    const activeCategory = searchParams.get('category') || '';
    const searchQuery = searchParams.get('q') || '';
    const sort = searchParams.get('sort') || '';
    const hasCategory = Boolean(activeCategory);

    // Find full category object from loaded list
    const activeCatObj = categories.find(c => c.slug === activeCategory) || null;

    const activeFilterCount = [searchQuery, sort].filter(Boolean).length;
    const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Newest First';

    /* Load active categories from DB (public — only is_active=true) */
    useEffect(() => {
        setCatsLoading(true);
        categoryService.getActive().then(({ data }) => {
            setCategories(data || []);
            setCatsLoading(false);
        });
    }, []);

    /* Load products when category / search / sort change */
    useEffect(() => {
        if (!hasCategory) { setProducts([]); return; }
        setProductsLoading(true);
        productService.getAll({
            category: activeCategory || undefined,
            search: searchQuery || undefined,
            sort,
        }).then(({ data }) => {
            setProducts(data || []);
            setProductsLoading(false);
        });
    }, [activeCategory, searchQuery, sort, hasCategory]);

    /* URL helpers */
    function setParam(key, value) {
        const params = new URLSearchParams(searchParams);
        if (value) { params.set(key, value); } else { params.delete(key); }
        setSearchParams(params);
    }

    function selectCategory(slug) { setSearchParams({ category: slug }); }

    function backToCategories() {
        setSearchParams({});
        setMobileSheetOpen(false);
    }

    /* Lock body scroll when sheet open */
    useEffect(() => {
        document.body.style.overflow = mobileSheetOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileSheetOpen]);

    return (
        <div className={styles.page} ref={pageRef}>

            {/* ── Breadcrumb ─────────────────────────── */}
            <nav className={`${styles.breadcrumb} reveal`} aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <ChevronRight size={13} aria-hidden="true" />
                {hasCategory ? (
                    <button className={styles.breadcrumbBtn} onClick={backToCategories}>Shop</button>
                ) : (
                    <span className={styles.breadcrumbActive}>Shop</span>
                )}
                {hasCategory && activeCatObj && (
                    <>
                        <ChevronRight size={13} aria-hidden="true" />
                        <span className={styles.breadcrumbActive}>{activeCatObj.name}</span>
                    </>
                )}
            </nav>

            {/* ════════════════════════════════════════
                VIEW A — Category Picker (no category param)
                ════════════════════════════════════════ */}
            {!hasCategory && (
                <section className={`${styles.pickerSection} reveal`}>
                    <header className={styles.pickerHeader}>
                        <h1 className={styles.pickerTitle}>Shop</h1>
                        <p className={styles.pickerSub}>Choose a category to explore the collection</p>
                    </header>

                    {catsLoading ? (
                        <div className={styles.categoryGrid}>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className={`${styles.catCardSkeleton}`} aria-hidden="true" />
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <div className={styles.emptyCategories}>
                            <ImageOff size={48} strokeWidth={1.2} />
                            <p>No categories available yet.</p>
                        </div>
                    ) : (
                        <div className={styles.categoryGrid}>
                            {categories.map(cat => (
                                <CategoryCard
                                    key={cat.id}
                                    cat={cat}
                                    onClick={() => selectCategory(cat.slug)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* ════════════════════════════════════════
                VIEW B — Product Listing (category set)
                ════════════════════════════════════════ */}
            {hasCategory && (
                <>
                    {/* Header */}
                    <header className={`${styles.listHeader} reveal`}>
                        <button className={styles.backBtn} onClick={backToCategories} aria-label="Back to categories">
                            <ChevronLeft size={16} strokeWidth={2.5} />
                            Categories
                        </button>

                        <div className={styles.listHeaderRow}>
                            <h1 className={styles.listTitle}>
                                {activeCatObj?.name || activeCategory}
                            </h1>
                            {!productsLoading && (
                                <p className={styles.resultCount}>
                                    {products.length} <span>products</span>
                                </p>
                            )}
                        </div>

                        {activeFilterCount > 0 && (
                            <div className={styles.activeFilters}>
                                {searchQuery && (
                                    <button className={styles.activeChip} onClick={() => setParam('q', '')}>
                                        &ldquo;{searchQuery}&rdquo;
                                        <X size={12} strokeWidth={2.5} />
                                    </button>
                                )}
                                {sort && (
                                    <button className={styles.activeChip} onClick={() => setParam('sort', '')}>
                                        {currentSortLabel}
                                        <X size={12} strokeWidth={2.5} />
                                    </button>
                                )}
                                <button
                                    className={styles.clearAll}
                                    onClick={() => setSearchParams({ category: activeCategory })}
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </header>

                    {/* Toolbar */}
                    <div className={`${styles.toolbar} reveal`}>
                        <div className={styles.searchWrapper}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                id="shop-search"
                                type="search"
                                className={styles.searchInput}
                                placeholder={`Search ${activeCatObj?.name || ''}…`}
                                value={searchQuery}
                                onChange={e => setParam('q', e.target.value)}
                                aria-label="Search products"
                            />
                            {searchQuery && (
                                <button className={styles.searchClear} onClick={() => setParam('q', '')} aria-label="Clear search">
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>

                        <div className={styles.toolbarRight}>
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

                            <div className={styles.layoutToggle} role="group" aria-label="Layout">
                                <button
                                    className={`${styles.layoutBtn} ${layout === 'grid' ? styles.layoutBtnActive : ''}`}
                                    onClick={() => setLayout('grid')} aria-label="Grid view" aria-pressed={layout === 'grid'}
                                ><Grid3x3 size={16} strokeWidth={1.8} /></button>
                                <button
                                    className={`${styles.layoutBtn} ${layout === 'list' ? styles.layoutBtnActive : ''}`}
                                    onClick={() => setLayout('list')} aria-label="List view" aria-pressed={layout === 'list'}
                                ><LayoutList size={16} strokeWidth={1.8} /></button>
                            </div>

                            {/* Mobile: switch category */}
                            <button className={styles.filterToggle} onClick={() => setMobileSheetOpen(true)} aria-label="Switch category">
                                <SlidersHorizontal size={16} strokeWidth={1.8} />
                                Category
                            </button>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <main>
                        {productsLoading ? (
                            <ProductSkeleton count={8} />
                        ) : products.length === 0 ? (
                            <div className={styles.empty}>
                                <div className={styles.emptyIcon}>🔍</div>
                                <h2 className={styles.emptyTitle}>No jerseys found</h2>
                                <p className={styles.emptyDesc}>
                                    Try adjusting your search, or{' '}
                                    <button className={styles.emptyLink} onClick={backToCategories}>
                                        browse all categories
                                    </button>.
                                </p>
                                {searchQuery && (
                                    <button className={styles.emptyReset} onClick={() => setSearchParams({ category: activeCategory })}>
                                        Clear search
                                    </button>
                                )}
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
                </>
            )}

            {/* ── Mobile: Category picker sheet ── */}
            {mobileSheetOpen && (
                <div className={styles.mobileOverlay} onClick={() => setMobileSheetOpen(false)} role="presentation">
                    <div
                        className={styles.mobileSheet}
                        onClick={e => e.stopPropagation()}
                        role="dialog" aria-modal="true" aria-label="Choose category"
                    >
                        <div className={styles.mobileSheetHeader}>
                            <h2 className={styles.mobileSheetTitle}>Categories</h2>
                            <button className={styles.mobileSheetClose} onClick={() => setMobileSheetOpen(false)} aria-label="Close">
                                <X size={20} strokeWidth={2} />
                            </button>
                        </div>
                        <div className={styles.mobileSheetBody}>
                            <div className={styles.mobileCatList}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`${styles.mobileCatItem} ${activeCategory === cat.slug ? styles.mobileCatItemActive : ''}`}
                                        onClick={() => { selectCategory(cat.slug); setMobileSheetOpen(false); }}
                                    >
                                        <span className={styles.mobileCatIcon}>
                                            {cat.image
                                                ? <img src={cat.image} alt="" className={styles.mobileCatImg} />
                                                : getFallback(cat.slug).icon}
                                        </span>
                                        <span className={styles.mobileCatLabel}>{cat.name}</span>
                                        <ChevronRight size={16} strokeWidth={2} className={styles.mobileCatArrow} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Category Card ─────────────────────────────────── */

function CategoryCard({ cat, onClick }) {
    const fb = getFallback(cat.slug);
    const hasImg = Boolean(cat.image);

    return (
        <button
            className={styles.catCard}
            onClick={onClick}
            aria-label={`Browse ${cat.name}`}
            style={{ '--cat-gradient': fb.gradient, '--cat-accent': fb.accent }}
        >
            {hasImg ? (
                <div className={styles.catCardImgWrap}>
                    <img src={cat.image} alt={cat.name} className={styles.catCardImg} loading="lazy" />
                    <div className={styles.catCardImgOverlay} />
                </div>
            ) : (
                <div className={styles.catCardVisual}>
                    <span className={styles.catCardGlow} style={{ background: fb.accent }} aria-hidden="true" />
                    <span className={styles.catCardIcon} aria-hidden="true">{fb.icon}</span>
                    <svg className={styles.catCardDecor} viewBox="0 0 120 120" fill="none" aria-hidden="true">
                        <circle cx="60" cy="60" r="55" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
                        <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="0.5" opacity="0.10" />
                        <circle cx="60" cy="60" r="25" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                    </svg>
                </div>
            )}

            <div className={styles.catCardContent}>
                {cat.description && <p className={styles.catCardSub}>{cat.description}</p>}
                <h2 className={styles.catCardLabel}>{cat.name}</h2>
                <span className={styles.catCardCta} style={{ color: fb.accent }}>Explore →</span>
            </div>

            <span className={styles.catCardStripe} style={{ background: fb.accent }} aria-hidden="true" />
        </button>
    );
}
