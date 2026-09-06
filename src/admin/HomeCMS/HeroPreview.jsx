import { ArrowRight, BadgeCheck, RotateCcw, Shield, Truck } from 'lucide-react';
import styles from './HomeCMS.module.css';

const ICONS = { Truck, Shield, RotateCcw, BadgeCheck };

export default function HeroPreview({ slide, stats = [], mode = 'desktop' }) {
    const image = slide?.desktop_image || '/hero-2026-27.png';
    const title = slide?.title || 'WEAR THE GAME.';
    const lines = title.split(' ');
    const first = lines.slice(0, -1).join(' ') || title;
    const last = lines.length > 1 ? lines.at(-1) : '';
    return (
        <div className={`${styles.previewFrame} ${mode === 'mobile' ? styles.previewMobile : ''}`}>
            <div className={styles.previewHero} style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.85), rgba(0,0,0,.28)), url(${image})` }}>
                <div className={styles.previewCopy}>
                    <span className={styles.previewEyebrow}><i /> {slide?.eyebrow || '2026 / 27 COLLECTION'}</span>
                    <h2>{first}{last && <><br />{last}<b>.</b></>}</h2>
                    <p>{slide?.subtitle || 'Premium authentic jerseys from the world’s biggest clubs and national teams.'}</p>
                    <div className={styles.previewButtons}><strong>{slide?.primary_button_text || 'SHOP COLLECTION'} <ArrowRight size={14} /></strong><span>{slide?.secondary_button_text || 'Explore Football'}</span></div>
                    <div className={styles.previewStats}>{(stats.length ? stats : [{ number: '500+', label: 'Jerseys' }, { number: '50+', label: 'Brands' }, { number: '10K+', label: 'Fans' }]).map(stat => <div key={`${stat.number}-${stat.label}`}><b>{stat.number}</b><small>{stat.label}</small></div>)}</div>
                </div>
            </div>
        </div>
    );
}

export function SettingsPreview({ features = [] }) {
    return <div className={styles.miniFeatures}>{features.map((item, index) => { const Icon = ICONS[item.icon] || BadgeCheck; return <div key={`${item.title}-${index}`}><Icon size={19} /><b>{item.title || 'Promise'}</b><p>{item.description}</p></div>; })}</div>;
}

export function PromoPreview({ section, mode = 'desktop' }) {
    return (
        <div className={`${styles.previewFrame} ${mode === 'mobile' ? styles.previewMobile : ''}`} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', background: '#111' }}>
            {section?.image ? (
                <img src={section.image} alt="Promo preview" style={{ width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '20px', color: '#666', fontSize: '12px' }}>No Promo Image Uploaded</div>
            )}
        </div>
    );
}
