import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader, Image as ImageIcon, Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { cmsService } from '../../services/cmsService';
import styles from './HomeCMS.module.css';

const emptySlide = {
    id: null,
    eyebrow: '',
    title: '',
    subtitle: '',
    description: '',
    primary_button_text: '',
    primary_button_url: '',
    secondary_button_text: '',
    secondary_button_url: '',
    desktop_image: '',
    mobile_image: '',
    display_order: 0,
    is_active: true,
};

const emptyAnnouncement = {
    id: null,
    text: '',
    display_order: 0,
    is_active: true,
};

export default function HomeCMS() {
    const [tab, setTab] = useState('hero');
    const [slides, setSlides] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [settings, setSettings] = useState({
        hero_autoplay: true,
        hero_autoplay_speed: 5000,
        animation_speed: 600,
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
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [slideForm, setSlideForm] = useState(emptySlide);
    const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
    const desktopInputRef = useRef(null);
    const mobileInputRef = useRef(null);

    useEffect(() => {
        loadCMS();
    }, []);

    async function loadCMS() {
        setLoading(true);
        setError('');

        const [heroRes, announcementRes, settingsRes, categoryRes, productRes] = await Promise.all([
            cmsService.getHeroSlides(),
            cmsService.getAnnouncements(),
            cmsService.getSettings(),
            categoryService.getAll(),
            productService.getAll({ limit: 200 }),
        ]);

        if (heroRes.error) setError(heroRes.error.message);
        if (announcementRes.error) setError(announcementRes.error.message);
        if (settingsRes.error) setError(settingsRes.error.message);

        setSlides(heroRes.data || []);
        setAnnouncements(announcementRes.data || []);
        setAllCategories(categoryRes.data || []);
        setAllProducts(productRes.data || []);
        setSettings({
            hero_autoplay: true,
            hero_autoplay_speed: 5000,
            animation_speed: 600,
            ...(settingsRes.data?.settings || {}),
            categories_section: {
                enabled: true,
                title: 'Shop by Sport',
                subtitle: '',
                limit: 5,
                category_ids: [],
                ...(settingsRes.data?.settings?.categories_section || {}),
            },
            featured_section: {
                enabled: true,
                title: 'Featured Drop',
                subtitle: "The jerseys everyone's talking about.",
                limit: 8,
                product_ids: [],
                ...(settingsRes.data?.settings?.featured_section || {}),
            },
            promo_section: {
                enabled: true,
                eyebrow: '2026 Season Drop',
                title: 'NEW SEASON.\nREPRESENT\nYOUR TEAM.',
                description: 'Get the latest designs with authentic materials and official branding. Limited stock available.',
                button_text: 'EXPLORE COLLECTION',
                button_url: '/shop',
                image: '',
                ...(settingsRes.data?.settings?.promo_section || {}),
            },
        });
        setLoading(false);
    }

    function toggleCategorySelection(categoryId) {
        const current = settings.categories_section?.category_ids || [];
        const next = current.includes(categoryId)
            ? current.filter(id => id !== categoryId)
            : [...current, categoryId];

        setSettings(prev => ({
            ...prev,
            categories_section: {
                ...prev.categories_section,
                category_ids: next,
            },
        }));
    }

    function toggleProductSelection(productId) {
        const current = settings.featured_section?.product_ids || [];
        const next = current.includes(productId)
            ? current.filter(id => id !== productId)
            : [...current, productId];

        setSettings(prev => ({
            ...prev,
            featured_section: {
                ...prev.featured_section,
                product_ids: next,
            },
        }));
    }

    const slideList = useMemo(() => slides || [], [slides]);
    const announcementList = useMemo(() => announcements || [], [announcements]);

    async function handleSaveSettings(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        const { error: saveError } = await cmsService.saveSettings(settings);
        if (saveError) {
            setError(saveError.message || 'Unable to save homepage settings.');
        }

        setSaving(false);
    }

    async function handleHeroSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                ...slideForm,
                display_order: slideForm.id ? slideForm.display_order : slideList.length,
                is_active: slideForm.is_active,
                desktop_image: slideForm.desktop_image || '',
                mobile_image: slideForm.mobile_image || '',
            };

            const { data, error: heroError } = slideForm.id
                ? await cmsService.updateHeroSlide(slideForm.id, payload)
                : await cmsService.createHeroSlide(payload);

            if (heroError) throw new Error(heroError.message);

            setSlideForm(emptySlide);
            setSlides(prev => {
                if (!slideForm.id) return [...prev, data];
                return prev.map(item => item.id === data.id ? data : item);
            });
        } catch (err) {
            setError(err.message || 'Unable to save hero slide.');
        } finally {
            setSaving(false);
        }
    }

    async function handleAnnouncementSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const payload = {
                ...announcementForm,
                display_order: announcementForm.id ? announcementForm.display_order : announcementList.length,
                is_active: announcementForm.is_active,
            };

            const { data, error: announcementError } = announcementForm.id
                ? await cmsService.updateAnnouncement(announcementForm.id, payload)
                : await cmsService.createAnnouncement(payload);

            if (announcementError) throw new Error(announcementError.message);

            setAnnouncementForm(emptyAnnouncement);
            setAnnouncements(prev => {
                if (!announcementForm.id) return [...prev, data];
                return prev.map(item => item.id === data.id ? data : item);
            });
        } catch (err) {
            setError(err.message || 'Unable to save announcement.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteSlide(id) {
        if (!window.confirm('Delete this hero slide?')) return;
        const { error } = await cmsService.deleteHeroSlide(id);
        if (error) {
            setError(error.message);
            return;
        }
        setSlides(prev => prev.filter(item => item.id !== id));
    }

    async function handleDeleteAnnouncement(id) {
        if (!window.confirm('Delete this announcement?')) return;
        const { error } = await cmsService.deleteAnnouncement(id);
        if (error) {
            setError(error.message);
            return;
        }
        setAnnouncements(prev => prev.filter(item => item.id !== id));
    }

    async function handleImageUpload(event, target) {
        const file = event.target.files?.[0];
        if (!file) return;

        setSaving(true);
        setError('');

        const { data: url, error: uploadError } = await cmsService.uploadCmsImage(file, 'cms/hero');
        if (uploadError) {
            setError(uploadError.message || 'Unable to upload image.');
            setSaving(false);
            return;
        }

        if (target === 'desktop') {
            setSlideForm(prev => ({ ...prev, desktop_image: url }));
        } else {
            setSlideForm(prev => ({ ...prev, mobile_image: url }));
        }

        setSaving(false);
        event.target.value = '';
    }

    if (loading) {
        return <div className={styles.loadingWrap}><Loader className={styles.spinner} /> Loading homepage CMS…</div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <p className={styles.eyebrow}>Homepage CMS</p>
                    <h1 className={styles.title}>Home Page</h1>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.tabs}>
                <button className={tab === 'hero' ? styles.tabActive : ''} onClick={() => setTab('hero')}>Hero Slides</button>
                <button className={tab === 'announcements' ? styles.tabActive : ''} onClick={() => setTab('announcements')}>Announcements</button>
                <button className={tab === 'settings' ? styles.tabActive : ''} onClick={() => setTab('settings')}>Settings</button>
            </div>

            {tab === 'hero' && (
                <div className={styles.grid}>
                    <form onSubmit={handleHeroSubmit} className={styles.panel}>
                        <h2>{slideForm.id ? 'Edit Hero Slide' : 'Add Hero Slide'}</h2>

                        <div className={styles.fieldGrid}>
                            <label>
                                Eyebrow
                                <input value={slideForm.eyebrow} onChange={e => setSlideForm({ ...slideForm, eyebrow: e.target.value })} />
                            </label>
                            <label>
                                Title
                                <input value={slideForm.title} onChange={e => setSlideForm({ ...slideForm, title: e.target.value })} required />
                            </label>
                            <label>
                                Subtitle
                                <input value={slideForm.subtitle} onChange={e => setSlideForm({ ...slideForm, subtitle: e.target.value })} />
                            </label>
                            <label>
                                Description
                                <textarea value={slideForm.description} onChange={e => setSlideForm({ ...slideForm, description: e.target.value })} />
                            </label>
                            <label>
                                Primary button text
                                <input value={slideForm.primary_button_text} onChange={e => setSlideForm({ ...slideForm, primary_button_text: e.target.value })} />
                            </label>
                            <label>
                                Primary button URL
                                <input value={slideForm.primary_button_url} onChange={e => setSlideForm({ ...slideForm, primary_button_url: e.target.value })} />
                            </label>
                            <label>
                                Secondary button text
                                <input value={slideForm.secondary_button_text} onChange={e => setSlideForm({ ...slideForm, secondary_button_text: e.target.value })} />
                            </label>
                            <label>
                                Secondary button URL
                                <input value={slideForm.secondary_button_url} onChange={e => setSlideForm({ ...slideForm, secondary_button_url: e.target.value })} />
                            </label>
                        </div>

                        <div className={styles.uploadRow}>
                            <div className={styles.uploadBox}>
                                <span>Desktop image</span>
                                {slideForm.desktop_image ? (
                                    <img src={slideForm.desktop_image} alt="Desktop preview" />
                                ) : (
                                    <div className={styles.imagePlaceholder}><ImageIcon size={24} /></div>
                                )}
                                <input type="file" accept="image/*" ref={desktopInputRef} onChange={(e) => handleImageUpload(e, 'desktop')} />
                            </div>

                            <div className={styles.uploadBox}>
                                <span>Mobile image</span>
                                {slideForm.mobile_image ? (
                                    <img src={slideForm.mobile_image} alt="Mobile preview" />
                                ) : (
                                    <div className={styles.imagePlaceholder}><ImageIcon size={24} /></div>
                                )}
                                <input type="file" accept="image/*" ref={mobileInputRef} onChange={(e) => handleImageUpload(e, 'mobile')} />
                            </div>
                        </div>

                        <label className={styles.toggleRow}>
                            <input type="checkbox" checked={slideForm.is_active} onChange={e => setSlideForm({ ...slideForm, is_active: e.target.checked })} />
                            Active
                        </label>

                        <div className={styles.actions}>
                            <button type="button" className={styles.secondaryBtn} onClick={() => setSlideForm(emptySlide)}>
                                <X size={15} /> Clear
                            </button>
                            <button type="submit" className={styles.primaryBtn} disabled={saving}>
                                {saving ? <Loader className={styles.spinner} /> : <Save size={15} />}
                                {slideForm.id ? 'Update Slide' : 'Create Slide'}
                            </button>
                        </div>
                    </form>

                    <div className={styles.panel}>
                        <h2>Hero Slides</h2>
                        <div className={styles.list}>
                            {slideList.length === 0 ? <p className={styles.empty}>No hero slides saved yet.</p> : slideList.map(slide => (
                                <div key={slide.id} className={styles.listItem}>
                                    {slide.desktop_image ? <img src={slide.desktop_image} alt={slide.title} /> : <div className={styles.listFallback} />}
                                    <div className={styles.listContent}>
                                        <strong>{slide.title || 'Untitled slide'}</strong>
                                        <small>{slide.is_active ? 'Active' : 'Inactive'}</small>
                                    </div>
                                    <div className={styles.listActions}>
                                        <button onClick={() => setSlideForm(slide)}><Pencil size={14} /></button>
                                        <button onClick={() => handleDeleteSlide(slide.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'announcements' && (
                <div className={styles.grid}>
                    <form onSubmit={handleAnnouncementSubmit} className={styles.panel}>
                        <h2>{announcementForm.id ? 'Edit Announcement' : 'Add Announcement'}</h2>

                        <label>
                            Text
                            <input value={announcementForm.text} onChange={e => setAnnouncementForm({ ...announcementForm, text: e.target.value })} required />
                        </label>

                        <label className={styles.toggleRow}>
                            <input type="checkbox" checked={announcementForm.is_active} onChange={e => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })} />
                            Active
                        </label>

                        <div className={styles.actions}>
                            <button type="button" className={styles.secondaryBtn} onClick={() => setAnnouncementForm(emptyAnnouncement)}>
                                <X size={15} /> Clear
                            </button>
                            <button type="submit" className={styles.primaryBtn} disabled={saving}>
                                {saving ? <Loader className={styles.spinner} /> : <Plus size={15} />}
                                {announcementForm.id ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>

                    <div className={styles.panel}>
                        <h2>Announcements</h2>
                        <div className={styles.list}>
                            {announcementList.length === 0 ? <p className={styles.empty}>No announcements yet.</p> : announcementList.map(item => (
                                <div key={item.id} className={styles.listItem}>
                                    <div className={styles.listContent}>
                                        <strong>{item.text}</strong>
                                        <small>{item.is_active ? 'Active' : 'Inactive'}</small>
                                    </div>
                                    <div className={styles.listActions}>
                                        <button onClick={() => setAnnouncementForm(item)}><Pencil size={14} /></button>
                                        <button onClick={() => handleDeleteAnnouncement(item.id)}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'settings' && (
                <form onSubmit={handleSaveSettings} className={styles.panel}>
                    <h2>Homepage Settings</h2>

                    <div className={styles.fieldGrid}>
                        <label>
                            Hero autoplay
                            <input type="checkbox" checked={Boolean(settings.hero_autoplay)} onChange={e => setSettings({ ...settings, hero_autoplay: e.target.checked })} />
                        </label>
                        <label>
                            Autoplay speed (ms)
                            <input type="number" value={settings.hero_autoplay_speed || 5000} onChange={e => setSettings({ ...settings, hero_autoplay_speed: Number(e.target.value) || 5000 })} />
                        </label>
                        <label>
                            Animation speed (ms)
                            <input type="number" value={settings.animation_speed || 600} onChange={e => setSettings({ ...settings, animation_speed: Number(e.target.value) || 600 })} />
                        </label>

                        <label>
                            Category section title
                            <input value={settings.categories_section?.title || ''} onChange={e => setSettings({
                                ...settings,
                                categories_section: { ...settings.categories_section, title: e.target.value },
                            })} />
                        </label>

                        <label>
                            Category section subtitle
                            <input value={settings.categories_section?.subtitle || ''} onChange={e => setSettings({
                                ...settings,
                                categories_section: { ...settings.categories_section, subtitle: e.target.value },
                            })} />
                        </label>

                        <label>
                            Category section limit
                            <input type="number" min="1" max="12" value={settings.categories_section?.limit || 5} onChange={e => setSettings({
                                ...settings,
                                categories_section: { ...settings.categories_section, limit: Number(e.target.value) || 5 },
                            })} />
                        </label>

                        <label>
                            Featured section title
                            <input value={settings.featured_section?.title || ''} onChange={e => setSettings({
                                ...settings,
                                featured_section: { ...settings.featured_section, title: e.target.value },
                            })} />
                        </label>

                        <label>
                            Featured section subtitle
                            <input value={settings.featured_section?.subtitle || ''} onChange={e => setSettings({
                                ...settings,
                                featured_section: { ...settings.featured_section, subtitle: e.target.value },
                            })} />
                        </label>

                        <label>
                            Featured section limit
                            <input type="number" min="1" max="12" value={settings.featured_section?.limit || 8} onChange={e => setSettings({
                                ...settings,
                                featured_section: { ...settings.featured_section, limit: Number(e.target.value) || 8 },
                            })} />
                        </label>

                        <label>
                            Promo eyebrow
                            <input value={settings.promo_section?.eyebrow || ''} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, eyebrow: e.target.value },
                            })} />
                        </label>

                        <label>
                            Promo title (one line per row)
                            <textarea value={settings.promo_section?.title || ''} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, title: e.target.value },
                            })} />
                        </label>

                        <label>
                            Promo description
                            <textarea value={settings.promo_section?.description || ''} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, description: e.target.value },
                            })} />
                        </label>

                        <label>
                            Promo button text
                            <input value={settings.promo_section?.button_text || ''} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, button_text: e.target.value },
                            })} />
                        </label>

                        <label>
                            Promo button URL
                            <input value={settings.promo_section?.button_url || ''} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, button_url: e.target.value },
                            })} />
                        </label>
                    </div>

                    <div className={styles.fieldGrid}>
                        <label className={styles.toggleRow}>
                            <input type="checkbox" checked={Boolean(settings.promo_section?.enabled !== false)} onChange={e => setSettings({
                                ...settings,
                                promo_section: { ...settings.promo_section, enabled: e.target.checked },
                            })} />
                            Show promotional section
                        </label>
                        <div className={styles.panel} style={{ padding: '1rem' }}>
                            <h3>Category section visibility</h3>
                            <label className={styles.toggleRow}>
                                <input type="checkbox" checked={Boolean(settings.categories_section?.enabled !== false)} onChange={e => setSettings({
                                    ...settings,
                                    categories_section: { ...settings.categories_section, enabled: e.target.checked },
                                })} />
                                Show category section
                            </label>

                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                                {allCategories.map(category => (
                                    <label key={category.id} className={styles.toggleRow} style={{ justifyContent: 'space-between' }}>
                                        <span>{category.name}</span>
                                        <input type="checkbox" checked={(settings.categories_section?.category_ids || []).includes(category.id)} onChange={() => toggleCategorySelection(category.id)} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.panel} style={{ padding: '1rem' }}>
                            <h3>Featured section visibility</h3>
                            <label className={styles.toggleRow}>
                                <input type="checkbox" checked={Boolean(settings.featured_section?.enabled !== false)} onChange={e => setSettings({
                                    ...settings,
                                    featured_section: { ...settings.featured_section, enabled: e.target.checked },
                                })} />
                                Show featured products section
                            </label>

                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                                {allProducts.map(product => (
                                    <label key={product.id} className={styles.toggleRow} style={{ justifyContent: 'space-between' }}>
                                        <span>{product.name}</span>
                                        <input type="checkbox" checked={(settings.featured_section?.product_ids || []).includes(product.id)} onChange={() => toggleProductSelection(product.id)} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.primaryBtn} disabled={saving}>
                            {saving ? <Loader className={styles.spinner} /> : <Save size={15} />}
                            Save Settings
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
