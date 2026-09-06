import { Fragment, useEffect, useMemo, useState, useRef } from 'react';
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
import { cmsService } from '../../services/cmsService';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import { ProductSkeleton } from '../../components/Loading/Loading';
import useScrollReveal from '../../hooks/useScrollReveal';
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

const HOME_ICON_MAP = { Truck, Shield, RotateCcw, BadgeCheck };

const DEFAULT_SETTINGS = {
    hero_autoplay: true,
    hero_autoplay_speed: 5000,
    categories_section: {
        enabled: true,
        title: 'Shop by Sport',
        subtitle: '',
        limit: 5,
        category_ids: [],
    },
    featured_section: {
        enabled: true,
        title: 'Featured Drop',
        subtitle: "The jerseys everyone's talking about.",
        limit: 8,
        product_ids: [],
    },
    promo_section: {
        enabled: true,
        eyebrow: '2026 Season Drop',
        title: 'NEW SEASON.\nREPRESENT\nYOUR TEAM.',
        description: 'Get the latest designs with authentic materials and official branding. Limited stock available.',
        button_text: 'EXPLORE COLLECTION',
        button_url: '/shop',
        image: '',
    },
    features_section: {
        eyebrow: 'Why Us',
        title: 'The JerseyStore Promise',
        items: [
            { icon: 'Truck', title: 'Free Shipping', description: 'Free delivery on all orders above ₹999. Get your jersey hassle-free.', order: 1 },
            { icon: 'BadgeCheck', title: '100% Authentic', description: 'Every jersey is sourced directly from official suppliers. Guaranteed real.', order: 2 },
            { icon: 'RotateCcw', title: 'Easy Returns', description: 'Not the right fit? Return within 15 days for a full refund, no questions asked.', order: 3 },
            { icon: 'Shield', title: 'Secure Payment', description: 'Industry-standard encryption protects your payment information always.', order: 4 },
        ],
    },
    hero_stats: [
        { number: '500+', label: 'Jerseys' },
        { number: '50+', label: 'Brands' },
        { number: '10K+', label: 'Fans' },
    ],
};

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [categories, setCategories] = useState([]);
    const [heroSlides, setHeroSlides] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [heroReady, setHeroReady] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    const mainRef = useRef(null);
    useScrollReveal(mainRef);

    const cmsAnnouncements = announcements.length > 0 ? announcements : MARQUEE_ITEMS.map((item) => ({ text: item, is_active: true }));
    const activeHeroSlide = heroSlides[activeSlideIndex] || heroSlides[0] || null;
    const categorySection = settings.categories_section || DEFAULT_SETTINGS.categories_section;
    const featuredSection = settings.featured_section || DEFAULT_SETTINGS.featured_section;
    const promoSection = settings.promo_section || DEFAULT_SETTINGS.promo_section;
    const featuresSection = settings.features_section || DEFAULT_SETTINGS.features_section;
    const heroStats = Array.isArray(settings.hero_stats) && settings.hero_stats.length ? settings.hero_stats : DEFAULT_SETTINGS.hero_stats;

    const visibleCategories = useMemo(() => {
        const selectedIds = (categorySection.category_ids || []).map(String);
        const limit = Number(categorySection.limit) || 5;
        const source = selectedIds.length
            ? selectedIds.map(id => categories.find(cat => String(cat.id) === id)).filter(Boolean)
            : categories;
        return source.slice(0, limit);
    }, [categories, categorySection]);

    const visibleFeaturedProducts = useMemo(() => {
        const selectedIds = (featuredSection.product_ids || []).map(String);
        const limit = Number(featuredSection.limit) || 8;
        const source = selectedIds.length
            ? selectedIds.map(id => featured.find(product => String(product.id) === id)).filter(Boolean)
            : featured;
        return source.slice(0, limit);
    }, [featured, featuredSection]);

    /* ── Data fetch ─────────────────────────── */
    useEffect(() => {
        async function load() {
            try {
                setLoadError('');
                const [featuredRes, catRes, heroRes, announcementRes, settingsRes] = await Promise.all([
                    productService.getFeatured(),
                    categoryService.getActive(),
                    cmsService.getHeroSlides({ activeOnly: true }),
                    cmsService.getAnnouncements({ activeOnly: true }),
                    cmsService.getSettings({ publishedOnly: true }),
                ]);

                setFeatured(featuredRes.data || []);
                setCategories(catRes.data || []);
                setHeroSlides(heroRes.data || []);
                setAnnouncements(announcementRes.data || []);
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(settingsRes.data?.settings || {}),
                    categories_section: {
                        ...DEFAULT_SETTINGS.categories_section,
                        ...(settingsRes.data?.settings?.categories_section || {}),
                    },
                    featured_section: {
                        ...DEFAULT_SETTINGS.featured_section,
                        ...(settingsRes.data?.settings?.featured_section || {}),
                    },
                    features_section: {
                        ...DEFAULT_SETTINGS.features_section,
                        ...(settingsRes.data?.settings?.features_section || {}),
                        items: settingsRes.data?.settings?.features_section?.items || DEFAULT_SETTINGS.features_section.items,
                    },
                    hero_stats: Array.isArray(settingsRes.data?.settings?.hero_stats)
                        ? settingsRes.data.settings.hero_stats
                        : DEFAULT_SETTINGS.hero_stats,
                    promo_section: {
                        ...DEFAULT_SETTINGS.promo_section,
                        ...(settingsRes.data?.settings?.promo_section || {}),
                    },
                });
                if (featuredRes.error || catRes.error) {
                    setLoadError('Some homepage content could not be loaded. Please try again shortly.');
                }
            } catch (err) {
                console.error('Error loading home data:', err);
                setLoadError('Homepage content is temporarily unavailable. Please try again shortly.');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        const autoplayEnabled = settings.hero_autoplay !== false;
        if (!autoplayEnabled || heroSlides.length <= 1) return;

        const interval = setInterval(() => {
            setActiveSlideIndex(prev => (prev + 1) % heroSlides.length);
        }, Number(settings.hero_autoplay_speed) || 5000);

        return () => clearInterval(interval);
    }, [heroSlides, settings.hero_autoplay, settings.hero_autoplay_speed]);

    /* ── Hero entrance ─────────────────────── */
    useEffect(() => {
        const t = setTimeout(() => setHeroReady(true), 60);
        return () => clearTimeout(t);
    }, []);

    const heroEyebrow = activeHeroSlide?.eyebrow ?? '2026 / 27 COLLECTION';
    const heroTitle = activeHeroSlide?.title ?? 'WEAR THE GAME.';
    const heroSubtitle = activeHeroSlide?.subtitle ?? 'Premium authentic jerseys from the world\'s biggest clubs and national teams.';
    const heroDescription = activeHeroSlide?.description ?? 'Discover premium jerseys built for matchday energy and everyday style.';
    const heroPrimaryText = activeHeroSlide?.primary_button_text ?? 'SHOP COLLECTION';
    const heroPrimaryUrl = activeHeroSlide?.primary_button_url ?? '/shop';
    const heroSecondaryText = activeHeroSlide?.secondary_button_text ?? 'Explore Football';
    const heroSecondaryUrl = activeHeroSlide?.secondary_button_url ?? '/shop?category=football';
    const heroDesktopImage = activeHeroSlide?.desktop_image || '/hero-2026-27.png';
    const heroMobileImage = activeHeroSlide?.mobile_image || heroDesktopImage;
    const heroMediaType = activeHeroSlide?.media_type || 'image';
    const heroVideoUrl = activeHeroSlide?.video_url || '';
    const heroAnimationType = activeHeroSlide?.animation_type || 'ken-burns';
    const heroAnimationDuration = activeHeroSlide?.animation_duration || 600;
    const heroBackgroundPosition = activeHeroSlide?.background_position || 'center';
    const featuredImage = featured[1]?.images?.[0] || featured[1]?.image || '';

    // Animation styling overrides
    const animationStyle = {
        transitionDuration: `${heroAnimationDuration}ms`,
        animationDuration: `${heroAnimationDuration}ms`
    };

    return (
        <main ref={mainRef} className={styles.main}>

            {/* ══════════════════════════════════════
                HERO — Cinematic editorial
            ══════════════════════════════════════ */}
            <section className={styles.hero} aria-label="Hero">
                <div className={styles.heroBg} aria-hidden="true">
                    {heroMediaType === 'video' && heroVideoUrl ? (
                        <video
                            src={heroVideoUrl}
                            className={styles.heroBgMedia}
                            poster={heroDesktopImage || undefined}
                            style={{ ...animationStyle, objectPosition: heroBackgroundPosition }}
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : heroDesktopImage ? (
                        <picture>
                            {heroMobileImage && <source media="(max-width: 767px)" srcSet={heroMobileImage} />}
                            <img
                                src={heroDesktopImage}
                                alt=""
                                className={`${styles.heroBgMedia} ${styles['anim-' + heroAnimationType] || ''}`}
                                style={{ ...animationStyle, objectPosition: heroBackgroundPosition }}
                            />
                        </picture>
                    ) : null}
                    {/* Dark gradient overlay removed to allow pure graphic display without dimming */}
                    {heroTitle && <div className={styles.heroOverlay} />}
                </div>
                {/* Noise texture */}
                <div className={styles.heroNoise} aria-hidden="true" />

                <div className={styles.heroLayout}>
                    {/* ── Left: text content ── */}
                    {heroTitle ? (
                        <div className={`${styles.heroText} ${heroReady ? styles.heroReady : ''}`}>
                            {/* Eyebrow */}
                            {heroEyebrow && (
                                <div className={styles.heroEyebrow}>
                                    <span className={styles.heroEyebrowDot} aria-hidden="true" />
                                    <span>{heroEyebrow}</span>
                                </div>
                            )}

                            {/* Editorial headline — two lines */}
                            <h1 className={styles.heroTitle} aria-label={heroTitle}>
                                {heroTitle.includes(' ') ? (
                                    <>
                                        <span className={styles.heroLine1}>{heroTitle.split(' ').slice(0, -1).join(' ')}</span>
                                        <span className={styles.heroLine2}>
                                            {heroTitle.split(' ').slice(-1)[0]}<span className={styles.heroAccent}>.</span>
                                        </span>
                                    </>
                                ) : (
                                    <span className={styles.heroLine1}>{heroTitle}</span>
                                )}
                            </h1>

                            {/* Sub-copy */}
                            {(heroSubtitle || heroDescription) && (
                                <p className={styles.heroSub}>
                                    {heroSubtitle || heroDescription}
                                </p>
                            )}

                            {/* CTAs */}
                            {(heroPrimaryText || heroSecondaryText) && (
                                <div className={styles.heroCtas}>
                                    {heroPrimaryText && (
                                        <Link to={heroPrimaryUrl} className={styles.heroPrimary}>
                                            {heroPrimaryText}
                                            <ArrowRight size={16} strokeWidth={2.5} />
                                        </Link>
                                    )}
                                    {heroSecondaryText && (
                                        <Link to={heroSecondaryUrl} className={styles.heroSecondary}>
                                            {heroSecondaryText}
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Stats strip */}
                            <div className={styles.heroStats}>
                                {heroStats.map((stat, index) => (
                                    <Fragment key={`${stat.number}-${stat.label}`}>
                                        {index > 0 && <div key={`divider-${index}`} className={styles.heroStatDivider} aria-hidden="true" />}
                                        <div className={styles.heroStat}>
                                            <span className={styles.heroStatNum}>{stat.number}</span>
                                            <span className={styles.heroStatLabel}>{stat.label}</span>
                                        </div>
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* If no text is provided, make the entire hero a clickable banner graphic */
                        <Link to={heroPrimaryUrl || '/shop'} className={styles.heroGraphicClickZone} aria-label="Explore Collection" style={{ display: 'block', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                        </Link>
                    )}

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
                    {[...cmsAnnouncements, ...cmsAnnouncements].map((item, i) => (
                        <span key={`${item.text}-${i}`} className={styles.marqueeItem}>
                            <span className={styles.marqueeDot} />
                            {item.text}
                        </span>
                    ))}
                </div>
            </div>

            {loadError && <div className={styles.homeError} role="status">{loadError}</div>}

            {/* ══════════════════════════════════════
                CATEGORIES — Premium visual cards
            ══════════════════════════════════════ */}
            {categorySection.enabled !== false && visibleCategories.length > 0 && (
                <section className={styles.categoriesSection}>
                    <div className={styles.sectionInner}>
                        <div className={`${styles.sectionHeader} reveal`}>
                            <div>
                                <span className={styles.sectionEyebrow}>Browse</span>
                                <h2 className={styles.sectionTitle}>{categorySection.title || 'Shop by Sport'}</h2>
                                {categorySection.subtitle && <p className={styles.sectionSub}>{categorySection.subtitle}</p>}
                            </div>
                            <Link to="/shop" className={styles.sectionLink}>
                                View All <ArrowRight size={14} strokeWidth={2.5} />
                            </Link>
                        </div>

                        <div className={`${styles.catGrid} stagger-children`}>
                            {visibleCategories.map((cat, idx) => {
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
                                        {cat.image ? (
                                            <img
                                                src={cat.image}
                                                alt=""
                                                className={styles.catImg}
                                                loading="lazy"
                                                aria-hidden="true"
                                                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                                            />
                                        ) : null}

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
            {featuredSection.enabled !== false && (
                <section className={styles.featuredSection}>
                    <div className={styles.sectionInner}>
                        <div className={`${styles.sectionHeader} reveal`}>
                            <div>
                                <span className={styles.sectionEyebrow}>Handpicked</span>
                                <h2 className={styles.sectionTitle}>{featuredSection.title || 'Featured Drop'}</h2>
                                {featuredSection.subtitle && <p className={styles.sectionSub}>{featuredSection.subtitle}</p>}
                            </div>
                            <Link to="/shop" className={styles.sectionLink}>
                                Shop All <ArrowRight size={14} strokeWidth={2.5} />
                            </Link>
                        </div>

                        <div className="reveal">
                            {loading ? (
                                <ProductSkeleton count={8} />
                            ) : visibleFeaturedProducts.length > 0 ? (
                                <ProductGrid products={visibleFeaturedProducts} />
                            ) : (
                                <div className={styles.featuredEmpty}>
                                    <h3>Featured jerseys are coming soon.</h3>
                                    <p>Check back shortly for our latest drops.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                PROMO BANNER — Cinematic campaign
            ══════════════════════════════════════ */}
            {promoSection.enabled !== false && (
                <section className={styles.banner} aria-label="Promotional banner">
                    <div className={styles.bannerBg} aria-hidden="true" />
                    <div className={styles.bannerNoise} aria-hidden="true" />
                    <div className={styles.bannerInner}>
                        {/* Left: text */}
                        <div className={`${styles.bannerText} reveal`}>
                            <span className={styles.bannerEyebrow}>{promoSection.eyebrow}</span>
                            <h2 className={styles.bannerTitle}>
                                {(promoSection.title || '').split('\n').map((line, index) => (
                                    <span key={`${line}-${index}`} className={index === 1 ? styles.bannerTitleAccent : ''}>
                                        {line}{index < promoSection.title.split('\n').length - 1 && <br />}
                                    </span>
                                ))}
                            </h2>
                            <p className={styles.bannerDesc}>{promoSection.description}</p>
                            <Link to={promoSection.button_url || '/shop'} className={styles.bannerCta}>
                                {promoSection.button_text || 'EXPLORE COLLECTION'}
                                <ArrowRight size={16} strokeWidth={2.5} />
                            </Link>
                        </div>

                        {/* Right: image */}
                        <div className={`${styles.bannerVisual} reveal reveal--right`} aria-hidden="true">
                            {promoSection.image || featuredImage ? (
                                <img
                                    src={promoSection.image || featuredImage}
                                    alt=""
                                    className={styles.bannerImg}
                                    loading="lazy"
                                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
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
            )}

            {/* ══════════════════════════════════════
                FEATURES — Editorial promise strip
            ══════════════════════════════════════ */}
            <section className={styles.featuresSection}>
                <div className={styles.sectionInner}>
                    <div className={`${styles.sectionHeader} reveal`}>
                        <div>
                            <span className={styles.sectionEyebrow}>{featuresSection.eyebrow || 'Why Us'}</span>
                            <h2 className={styles.sectionTitle}>{featuresSection.title || 'The JerseyStore Promise'}</h2>
                        </div>
                    </div>

                    <div className={`${styles.featureGrid} stagger-children`}>
                        {(featuresSection.items || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((item, index) => {
                            const Icon = HOME_ICON_MAP[item.icon] || BadgeCheck;
                            return (
                                <div key={`${item.title}-${index}`} className={styles.featureCard}>
                                    <div className={styles.featureNum} aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                                    <div className={styles.featureIconWrap}>
                                        <Icon size={22} strokeWidth={1.8} />
                                    </div>
                                    <h3 className={styles.featureTitle}>{item.title}</h3>
                                    <p className={styles.featureDesc}>{item.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

        </main>
    );
}
