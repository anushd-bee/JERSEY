import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    Menu,
    X,
    ShoppingCart,
    Heart,
    User,
    Search,
    LogOut,
    LayoutDashboard,
    ArrowRight,
    TrendingUp,
    Flame,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import styles from './Navbar.module.css';

const TRENDING_SEARCHES = [
    { label: 'Real Madrid', href: '/shop?team=real-madrid' },
    { label: 'Barcelona', href: '/shop?team=barcelona' },
    { label: 'Man City', href: '/shop?team=man-city' },
    { label: 'Team India', href: '/shop?team=india' },
    { label: 'NBA Lakers', href: '/shop?team=lakers' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartBump, setCartBump] = useState(false);

    const { user, isAdmin, signOut } = useAuth();
    const { totalItems } = useCart();
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const closeMobile = useCallback(() => setMenuOpen(false), []);

    /* Listen for fly-to-cart arrival to trigger bump animation */
    useEffect(() => {
        function handleBump() {
            setCartBump(true);
            const t = setTimeout(() => setCartBump(false), 400);
            return () => clearTimeout(t);
        }
        window.addEventListener('cart-icon-bump', handleBump);
        return () => window.removeEventListener('cart-icon-bump', handleBump);
    }, []);

    /* ── Scroll detection ──────────────────────── */
    useEffect(() => {
        function handleScroll() {
            setScrolled(window.scrollY > 12);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /* ── Body scroll lock when menus open ─────── */
    useEffect(() => {
        if (menuOpen || searchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen, searchOpen]);

    /* ── Focus search input when overlay opens ── */
    useEffect(() => {
        if (searchOpen) {
            // tiny delay so the CSS transition starts first
            const t = setTimeout(() => searchInputRef.current?.focus(), 80);
            return () => clearTimeout(t);
        }
    }, [searchOpen]);

    /* ── Keyboard shortcuts ─────────────────────── */
    useEffect(() => {
        function handleKey(e) {
            // Cmd/Ctrl + K → open search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(prev => !prev);
            }
            // Escape → close anything open
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setMenuOpen(false);
            }
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    /* ── Handlers ──────────────────────────────── */
    async function handleSignOut() {
        await signOut();
        closeMobile();
        navigate('/');
    }

    function handleSearchSubmit(e) {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearchOpen(false);
        setSearchQuery('');
        navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }

    function handleTrendingClick(href) {
        setSearchOpen(false);
        setSearchQuery('');
        navigate(href);
    }

    /* ── className helpers ─────────────────────── */
    const linkClass = ({ isActive }) =>
        `${styles.navLink} ${isActive ? styles.active : ''}`;


    const mobileLinkClass = ({ isActive }) =>
        `${styles.mobileLink} ${isActive ? styles.active : ''}`;

    return (
        <>
            {/* ─── Navbar ─── */}
            <nav
                className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
                role="navigation"
                aria-label="Main navigation"
            >
                <div className={styles.navbarInner}>
                    {/* Logo */}
                    <Link to="/" className={styles.logo} onClick={closeMobile} aria-label="JerseyStore home">
                        JERSEY<span className={styles.logoDot} aria-hidden="true" /><span className={styles.logoAccent}>STORE</span>
                    </Link>

                    {/* Desktop Links */}
                    <ul className={styles.navLinks} role="list">
                        <li>
                            <NavLink to="/" className={linkClass} end>Home</NavLink>
                        </li>
                        <li>
                            <NavLink to="/shop" className={linkClass}>Shop</NavLink>
                        </li>
                        <li>
                            <NavLink to="/offer" className={linkClass}>Offer</NavLink>
                        </li>
                    </ul>

                    {/* Actions */}
                    <div className={styles.navActions}>
                        {/* Search */}
                        <button
                            className={styles.navAction}
                            onClick={() => setSearchOpen(true)}
                            aria-label="Search products"
                            aria-expanded={searchOpen}
                        >
                            <Search size={19} strokeWidth={1.8} />
                        </button>

                        {/* Wishlist — show when logged in */}
                        {user && (
                            <Link to="/wishlist" className={styles.navAction} aria-label="My wishlist">
                                <Heart size={19} strokeWidth={1.8} />
                            </Link>
                        )}

                        {/* Cart */}
                        <Link
                            to="/cart"
                            className={`${styles.navAction} ${cartBump ? styles.cartBumpAnim : ''}`}
                            aria-label={`Shopping cart — ${totalItems} items`}
                            data-cart-icon
                        >
                            <ShoppingCart size={19} strokeWidth={1.8} />
                            {totalItems > 0 && (
                                <span className={styles.cartBadge} aria-label={`${totalItems} items`}>
                                    {totalItems > 99 ? '99+' : totalItems}
                                </span>
                            )}
                        </Link>

                        {/* Account */}
                        {user ? (
                            <Link to="/profile" className={styles.navAction} aria-label="My account">
                                <User size={19} strokeWidth={1.8} />
                            </Link>
                        ) : (
                            <Link to="/login" className={styles.navAction} aria-label="Sign in">
                                <User size={19} strokeWidth={1.8} />
                            </Link>
                        )}

                        {/* Mobile toggle */}
                        <button
                            className={styles.menuToggle}
                            onClick={() => setMenuOpen(prev => !prev)}
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-menu"
                        >
                            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
                        </button>
                    </div>
                </div>

                {/* ─── Mobile Menu ─── */}
                <div
                    id="mobile-menu"
                    className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}
                    aria-hidden={!menuOpen}
                >
                    <div className={styles.mobileMenuInner}>
                        {/* Main nav */}
                        <span className={styles.mobileSectionLabel}>Navigate</span>
                        <NavLink to="/" className={mobileLinkClass} onClick={closeMobile} end>
                            Home
                        </NavLink>
                        <NavLink to="/shop" className={mobileLinkClass} onClick={closeMobile}>
                            Shop
                        </NavLink>
                        <NavLink to="/offer" className={mobileLinkClass} onClick={closeMobile}>
                            Offer
                        </NavLink>

                        <div className={styles.mobileDivider} />

                        {/* Account */}
                        {user ? (
                            <>
                                <span className={styles.mobileSectionLabel}>Account</span>
                                <NavLink to="/profile" className={mobileLinkClass} onClick={closeMobile}>
                                    <User size={18} strokeWidth={1.8} /> My Profile
                                </NavLink>
                                <NavLink to="/wishlist" className={mobileLinkClass} onClick={closeMobile}>
                                    <Heart size={18} strokeWidth={1.8} /> Wishlist
                                </NavLink>
                                <NavLink to="/cart" className={mobileLinkClass} onClick={closeMobile}>
                                    <ShoppingCart size={18} strokeWidth={1.8} /> Cart {totalItems > 0 && `(${totalItems})`}
                                </NavLink>
                                {isAdmin && (
                                    <NavLink to="/admin" className={mobileLinkClass} onClick={closeMobile}>
                                        <LayoutDashboard size={18} strokeWidth={1.8} /> Admin Panel
                                    </NavLink>
                                )}
                                <button className={styles.mobileLink} onClick={handleSignOut}>
                                    <LogOut size={18} strokeWidth={1.8} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <NavLink to="/login" className={mobileLinkClass} onClick={closeMobile}>
                                <User size={18} strokeWidth={1.8} /> Sign In
                            </NavLink>
                        )}
                    </div>
                </div>
            </nav>

            {/* ─── Search Overlay ─── */}
            <div
                className={`${styles.searchOverlay} ${searchOpen ? styles.open : ''}`}
                role="search"
                aria-label="Site search"
                aria-hidden={!searchOpen}
            >
                <div className={styles.searchOverlayInner}>
                    <form onSubmit={handleSearchSubmit}>
                        <div className={styles.searchInputRow}>
                            <Search size={22} strokeWidth={1.8} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                            <input
                                ref={searchInputRef}
                                type="search"
                                className={styles.searchInputField}
                                placeholder="Search jerseys, teams, sports…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                aria-label="Search"
                            />
                            <button
                                type="button"
                                className={styles.searchClose}
                                onClick={() => setSearchOpen(false)}
                                aria-label="Close search"
                            >
                                <X size={22} />
                            </button>
                        </div>
                    </form>

                    <div className={styles.searchTrending}>
                        <span className={styles.searchTrendingLabel}>
                            <TrendingUp size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 6 }} />
                            Trending
                        </span>
                        {TRENDING_SEARCHES.map(item => (
                            <button
                                key={item.label}
                                className={styles.searchChip}
                                onClick={() => handleTrendingClick(item.href)}
                            >
                                {item.label} <ArrowRight size={12} strokeWidth={2} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Backdrop behind search overlay */}
            {searchOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.40)',
                        zIndex: 'calc(var(--z-top) - 1)',
                        cursor: 'pointer',
                    }}
                    onClick={() => setSearchOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
