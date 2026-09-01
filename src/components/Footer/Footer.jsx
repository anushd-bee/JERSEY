import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, RotateCcw } from 'lucide-react';

/* Inline social SVGs — lucide-react@1.x doesn't include these */
function IconInstagram({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
        </svg>
    );
}

function IconTwitterX({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function IconYoutube({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
            <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
    );
}

function IconFacebook({ size = 18 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}
import styles from './Footer.module.css';

const YEAR = new Date().getFullYear();

export default function Footer() {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    function handleNewsletter(e) {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) return;
        // Newsletter is UI-only; backend integration goes in a later phase.
        setSubscribed(true);
        setEmail('');
    }

    return (
        <footer className={styles.footer}>
            {/* ── Promise strip ────────────────────── */}
            <div className={styles.promiseBar}>
                <div className={styles.promiseInner}>
                    <div className={styles.promiseItem}>
                        <Truck size={18} strokeWidth={1.8} />
                        <span>Free Shipping over ₹999</span>
                    </div>
                    <div className={styles.promiseDivider} aria-hidden="true" />
                    <div className={styles.promiseItem}>
                        <Shield size={18} strokeWidth={1.8} />
                        <span>100% Authentic</span>
                    </div>
                    <div className={styles.promiseDivider} aria-hidden="true" />
                    <div className={styles.promiseItem}>
                        <RotateCcw size={18} strokeWidth={1.8} />
                        <span>15-Day Easy Returns</span>
                    </div>
                </div>
            </div>

            {/* ── Main footer ───────────────────────── */}
            <div className={styles.footerMain}>
                <div className={styles.footerInner}>
                    {/* Brand column */}
                    <div className={styles.brand}>
                        <Link to="/" className={styles.brandLogo} aria-label="JerseyStore home">
                            JERSEY<span className={styles.brandAccent}>STORE</span>
                        </Link>
                        <p className={styles.brandDesc}>
                            Your premium destination for authentic sports jerseys.
                            From football to basketball to cricket — gear up with the best.
                        </p>
                        {/* Social */}
                        <div className={styles.social}>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="Instagram"
                            >
                                <IconInstagram size={18} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="Twitter / X"
                            >
                                <IconTwitterX size={18} />
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="YouTube"
                            >
                                <IconYoutube size={18} />
                            </a>
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                                aria-label="Facebook"
                            >
                                <IconFacebook size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Shop column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnHeading}>Shop</h3>
                        <ul>
                            <li><Link to="/shop">All Jerseys</Link></li>
                            <li><Link to="/shop?category=football">Football</Link></li>
                            <li><Link to="/shop?category=basketball">Basketball</Link></li>
                            <li><Link to="/shop?category=cricket">Cricket</Link></li>
                            <li><Link to="/shop?sort=newest">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Support column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnHeading}>Support</h3>
                        <ul>
                            <li><Link to="/profile">My Account</Link></li>
                            <li><Link to="/cart">Shopping Cart</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                            <li><Link to="/">Shipping Info</Link></li>
                            <li><Link to="/">Returns & Refunds</Link></li>
                        </ul>
                    </div>

                    {/* Company column */}
                    <div className={styles.column}>
                        <h3 className={styles.columnHeading}>Company</h3>
                        <ul>
                            <li><Link to="/">About Us</Link></li>
                            <li><Link to="/">Authenticity Policy</Link></li>
                            <li><Link to="/">Privacy Policy</Link></li>
                            <li><Link to="/">Terms of Service</Link></li>
                            <li><Link to="/">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className={styles.newsletter}>
                        <h3 className={styles.columnHeading}>Stay Updated</h3>
                        <p className={styles.newsletterDesc}>
                            New drops, exclusive deals, and limited editions — straight to your inbox.
                        </p>
                        {subscribed ? (
                            <div className={styles.newsletterSuccess}>
                                ✓ You&apos;re subscribed!
                            </div>
                        ) : (
                            <form className={styles.newsletterForm} onSubmit={handleNewsletter}>
                                <input
                                    type="email"
                                    className={styles.newsletterInput}
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    aria-label="Email address for newsletter"
                                />
                                <button
                                    type="submit"
                                    className={styles.newsletterBtn}
                                    aria-label="Subscribe to newsletter"
                                >
                                    <ArrowRight size={16} strokeWidth={2.5} />
                                </button>
                            </form>
                        )}
                        <p className={styles.newsletterNote}>
                            No spam. Unsubscribe any time.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Bottom bar ──────────────────────── */}
            <div className={styles.footerBottom}>
                <div className={styles.footerBottomInner}>
                    <span>© {YEAR} JerseyStore. All rights reserved.</span>
                    <div className={styles.footerLinks}>
                        <Link to="/">Privacy</Link>
                        <Link to="/">Terms</Link>
                        <Link to="/">Sitemap</Link>
                    </div>
                    {/* Payment icons (SVG inline for lightweight) */}
                    <div className={styles.paymentIcons} aria-label="Accepted payment methods">
                        <span className={styles.paymentIcon}>VISA</span>
                        <span className={styles.paymentIcon}>MC</span>
                        <span className={styles.paymentIcon}>UPI</span>
                        <span className={styles.paymentIcon}>RZP</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
