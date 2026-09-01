import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Truck,
    Shield,
    RotateCcw,
    BadgeCheck,
    ChevronRight,
} from 'lucide-react';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { ProductSkeleton } from '../../components/Loading/Loading';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './Home.module.css';

/* ── Category visual config ─────────────────── */
const CATEGORY_CONFIG = {
    football: { gradient: 'linear-gradient(145deg, #0f2027, #203a43, #2c5364)', accent: '#4ade80' },
    basketball: { gradient: 'linear-gradient(145deg, #1a0533, #2d0f5e, #4a1f8c)', accent: '#f97316' },
    cricket: { gradient: 'linear-gradient(145deg, #052e16, #14532d, #166534)', accent: '#facc15' },
    baseball: { gradient: 'linear-gradient(145deg, #1e1b4b, #312e81, #4338ca)', accent: '#60a5fa' },
    rugby: { gradient: 'linear-gradient(145deg, #1c0a00, #3d1a00, #78350f)', accent: '#fb923c' },
    hockey: { gradient: 'linear-gradient(145deg, #0c1445, #1e3a6b, #1d4ed8)', accent: '#38bdf8' },
};

const DEFAULT_CAT_GRADIENT = 'linear-gradient(145deg, #111, #1a1a1a, #222)';

/* ── Marquee items ──────────────────────────── */
const MARQUEE_ITEMS = [
    'AUTHENTIC JERSEYS',
    'NEW SEASON',
    'OFFICIAL COLLECTIONS',
    'PREMIUM QUALITY',
    'WORLDWIDE SHIPPING',
    'VERIFIED AUTHENTIC',
];

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroReady, setHeroReady] = useState(false);

    const mainRef = useRef(null);
    useScrollReveal(mainRef);

    /* ── Data fetch ─────────────────────────── */
    useEffect(() => {
        async function load() {
            try {
                const [featuredRes, catRes] = await Promise.all([
                    productService.getFeatured(),
                    categoryService.getAll(),
                ]);
                setFeatured(featuredRes.data || []);
                setCategories(catRes.data || []);
            } catch (err) {
                console.error('Error loading home data:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    /* ── Hero entrance ─────────────────────── */
    useEffect(() => {
        const t = setTimeout(() => setHeroReady(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <main ref={mainRef} className={styles.main}>

            {/* ══════════════════════════════════════
                HERO — Cinematic editorial
            ══════════════════════════════════════ */}
            <section className={styles.hero} aria-label="Hero">
                {/* Dark background */}
                <div className={styles.heroBg} aria-hidden="true" />
                {/* Accent gradient blob */}
                <div className={styles.heroBlob} aria-hidden="true" />
                {/* Noise texture */}
                <div className={styles.heroNoise} aria-hidden="true" />

                <div className={styles.heroLayout}>
                    {/* ── Left: text content ── */}
                    <div className={`${styles.heroText} ${heroReady ? styles.heroReady : ''}`}>
                        {/* Eyebrow */}
                        <div className={styles.heroEyebrow}>
                            <span className={styles.heroEyebrowDot} aria-hidden="true" />
                            <span>2026 / 27 COLLECTION</span>
                        </div>

                        {/* Editorial headline — two lines */}
                        <h1 className={styles.heroTitle} aria-label="Wear The Game.">
                            <span className={styles.heroLine1}>WEAR</span>
                            <span className={styles.heroLine2}>
                                THE<span className={styles.heroAccent}> GAME.</span>
                            </span>
                        </h1>

                        {/* Sub-copy */}
                        <p className={styles.heroSub}>
                            Premium authentic jerseys from the world's biggest clubs
                            and national teams. Represent your team on and off the field.
                        </p>

                        {/* CTAs */}
                        <div className={styles.heroCtas}>
                            <Link to="/shop" className={styles.heroPrimary}>
                                SHOP COLLECTION
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </Link>
                            <Link to="/shop?category=football" className={styles.heroSecondary}>
                                Explore Football
                            </Link>
                        </div>

                        {/* Stats strip */}
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>500+</span>
                                <span className={styles.heroStatLabel}>Jerseys</span>
                            </div>
                            <div className={styles.heroStatDivider} aria-hidden="true" />
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>50+</span>
                                <span className={styles.heroStatLabel}>Brands</span>
                            </div>
                            <div className={styles.heroStatDivider} aria-hidden="true" />
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>10K+</span>
                                <span className={styles.heroStatLabel}>Fans</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Right: image composition ── */}
                    <div className={`${styles.heroImage} ${heroReady ? styles.heroReady : ''}`} aria-hidden="true">
                        <div className={styles.heroImageFrame}>
                            {/* Featured product image if available, else editorial placeholder */}
                            {featured[0]?.images?.[0] || featured[0]?.image ? (
                                <img
                                    src={featured[0]?.images?.[0] || featured[0]?.image}
                                    alt="Featured jersey"
                                    className={styles.heroImg}
                                />
                            ) : (
                                <div className={styles.heroImgPlaceholder}>
                                    <div className={styles.heroImgPlaceholderInner}>
                                        <span className={styles.heroImgIcon}>⚽</span>
                                        <span className={styles.heroImgIconB}>🏀</span>
                                        <span className={styles.heroImgIconC}>🏏</span>
                                    </div>
                                </div>
                            )}
                            {/* Floating accent label */}
                            <div className={styles.heroFloatLabel}>
                                <span>Season 2026/27</span>
                            </div>
                            {/* Corner accent */}
                            <div className={styles.heroCornerAccent} aria-hidden="true" />
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className={styles.heroScroll} aria-hidden="true">
                    <div className={styles.heroScrollLine} />
                </div>
            </section>

            {/* ══════════════════════════════════════
                MARQUEE — Brand statement bar
            ══════════════════════════════════════ */}
            <div className={styles.marqueeBar} aria-hidden="true">
                <div className={styles.marqueeTrack}>
                    {/* Doubled for seamless loop */}
                    {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
                        <span key={i} className={styles.marqueeItem}>
                            <span className={styles.marqueeDot} />
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════
                CATEGORIES — Premium visual cards
            ══════════════════════════════════════ */}
            {categories.length > 0 && (
                <section className={styles.categoriesSection}>
                    <div className={styles.sectionInner}>
                        <div className={`${styles.sectionHeader} reveal`}>
                            <div>
                                <span className={styles.sectionEyebrow}>Browse</span>
                                <h2 className={styles.sectionTitle}>Shop by Sport</h2>
                            </div>
                            <Link to="/shop" className={styles.sectionLink}>
                                View All <ArrowRight size={14} strokeWidth={2.5} />
                            </Link>
                        </div>

                        <div className={`${styles.catGrid} stagger-children`}>
                            {categories.slice(0, 5).map((cat, idx) => {
                                const config = CATEGORY_CONFIG[cat.slug] || {};
                                return (
                                    <Link
                                        key={cat.id}
                                        to={`/shop?category=${cat.slug}`}
                                        className={`${styles.catCard} ${idx === 0 ? styles.catCardFeatured : ''}`}
                                        style={{ '--cat-gradient': config.gradient || DEFAULT_CAT_GRADIENT }}
                                        aria-label={`${cat.name} jerseys`}
                                    >
                                        {/* Background */}
                                        <div className={styles.catBg} aria-hidden="true" />

                                        {/* Category image if available */}
                                        {cat.image && (
                                            <img
                                                src={cat.image}
                                                alt=""
                                                className={styles.catImg}
                                                loading="lazy"
                                                aria-hidden="true"
                                            />
                                        )}

                                        {/* Overlay gradient */}
                                        <div className={styles.catOverlay} aria-hidden="true" />

                                        {/* Content */}
                                        <div className={styles.catContent}>
                                            <div>
                                                <h3 className={styles.catName}>{cat.name}</h3>
                                                {cat.product_count != null && (
                                                    <p className={styles.catCount}>
                                                        {cat.product_count} {cat.product_count === 1 ? 'product' : 'products'}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={styles.catArrow}>
                                                <ChevronRight size={18} strokeWidth={2.5} />
                                            </div>
                                        </div>

                                        {/* Top tag */}
                                        {idx === 0 && (
                                            <div className={styles.catFeaturedTag}>Popular</div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                FEATURED PRODUCTS
            ══════════════════════════════════════ */}
            <section className={styles.featuredSection}>
                <div className={styles.sectionInner}>
                    <div className={`${styles.sectionHeader} reveal`}>
                        <div>
                            <span className={styles.sectionEyebrow}>Handpicked</span>
                            <h2 className={styles.sectionTitle}>Featured Drop</h2>
                            <p className={styles.sectionSub}>The jerseys everyone&apos;s talking about.</p>
                        </div>
                        <Link to="/shop" className={styles.sectionLink}>
                            Shop All <ArrowRight size={14} strokeWidth={2.5} />
                        </Link>
                    </div>

                    <div className="reveal">
                        {loading ? (
                            <ProductSkeleton count={8} />
                        ) : (
                            <ProductGrid products={featured} />
                        )}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                PROMO BANNER — Cinematic campaign
            ══════════════════════════════════════ */}
            <section className={styles.banner} aria-label="Promotional banner">
                <div className={styles.bannerBg} aria-hidden="true" />
                <div className={styles.bannerNoise} aria-hidden="true" />
                <div className={styles.bannerInner}>
                    {/* Left: text */}
                    <div className={`${styles.bannerText} reveal`}>
                        <span className={styles.bannerEyebrow}>2026 Season Drop</span>
                        <h2 className={styles.bannerTitle}>
                            NEW SEASON.<br />
                            <span className={styles.bannerTitleAccent}>REPRESENT</span><br />
                            YOUR TEAM.
                        </h2>
                        <p className={styles.bannerDesc}>
                            Get the latest designs with authentic materials and official
                            branding. Limited stock available.
                        </p>
                        <Link to="/shop" className={styles.bannerCta}>
                            EXPLORE COLLECTION
                            <ArrowRight size={16} strokeWidth={2.5} />
                        </Link>
                    </div>

                    {/* Right: image */}
                    <div className={`${styles.bannerVisual} reveal reveal--right`} aria-hidden="true">
                        {featured[1]?.images?.[0] || featured[1]?.image ? (
                            <img
                                src={featured[1]?.images?.[0] || featured[1]?.image}
                                alt=""
                                className={styles.bannerImg}
                                loading="lazy"
                            />
                        ) : (
                            <div className={styles.bannerImgPlaceholder}>
                                <span className={styles.bannerImgBig}>⚽</span>
                                <div className={styles.bannerImgGlare} />
                            </div>
                        )}
                        <div className={styles.bannerImageAccent} />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════
                FEATURES — Editorial promise strip
            ══════════════════════════════════════ */}
            <section className={styles.featuresSection}>
                <div className={styles.sectionInner}>
                    <div className={`${styles.sectionHeader} reveal`}>
                        <div>
                            <span className={styles.sectionEyebrow}>Why US</span>
                            <h2 className={styles.sectionTitle}>The JerseyStore Promise</h2>
                        </div>
                    </div>

                    <div className={`${styles.featureGrid} stagger-children`}>
                        {[
                            {
                                Icon: Truck,
                                title: 'Free Shipping',
                                desc: 'Free delivery on all orders above ₹999. Get your jersey hassle-free.',
                                num: '01',
                            },
                            {
                                Icon: BadgeCheck,
                                title: '100% Authentic',
                                desc: 'Every jersey is sourced directly from official suppliers. Guaranteed real.',
                                num: '02',
                            },
                            {
                                Icon: RotateCcw,
                                title: 'Easy Returns',
                                desc: 'Not the right fit? Return within 15 days for a full refund, no questions asked.',
                                num: '03',
                            },
                            {
                                Icon: Shield,
                                title: 'Secure Payment',
                                desc: 'Industry-standard encryption protects your payment information always.',
                                num: '04',
                            },
                        ].map(({ Icon, title, desc, num }) => (
                            <div key={num} className={styles.featureCard}>
                                <div className={styles.featureNum} aria-hidden="true">{num}</div>
                                <div className={styles.featureIconWrap}>
                                    <Icon size={22} strokeWidth={1.8} />
                                </div>
                                <h3 className={styles.featureTitle}>{title}</h3>
                                <p className={styles.featureDesc}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    );
}
