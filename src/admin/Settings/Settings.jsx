import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle, Truck, Tag, Percent, RotateCcw, Globe } from 'lucide-react';
import { storeSettingsService } from '../../services/storeSettingsService';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { PageLoader } from '../../components/Loading/Loading';
import styles from './Settings.module.css';

export default function AdminSettings() {
    const { refreshSettings } = useStoreSettings();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        const { data, error } = await storeSettingsService.getSettings();
        if (error) {
            setError('Failed to load settings.');
        } else {
            setSettings(data || {
                shipping_fee: 99,
                free_shipping_threshold: 999,
                enable_global_offers: false,
                default_offer_percentage: 0,
                enable_tax_calculation: false,
                tax_percentage: 0,
                return_period_days: 15,
                currency: 'INR'
            });
        }
        setLoading(false);
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (settings.shipping_fee < 0) return 'Shipping fee cannot be negative.';
        if (settings.free_shipping_threshold < 0) return 'Free shipping threshold cannot be negative.';
        if (settings.default_offer_percentage < 0 || settings.default_offer_percentage > 100) return 'Offer percentage must be between 0 and 100.';
        if (settings.tax_percentage < 0 || settings.tax_percentage > 100) return 'Tax percentage must be between 0 and 100.';
        if (settings.return_period_days <= 0) return 'Return period must be greater than 0.';
        if (!settings.currency) return 'Currency code is required.';
        return null;
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);
        const { data, error } = await storeSettingsService.updateSettings(settings.id, {
            shipping_fee: settings.shipping_fee,
            free_shipping_threshold: settings.free_shipping_threshold,
            enable_global_offers: settings.enable_global_offers,
            default_offer_percentage: settings.default_offer_percentage,
            enable_tax_calculation: settings.enable_tax_calculation,
            tax_percentage: settings.tax_percentage,
            return_period_days: settings.return_period_days,
            currency: settings.currency || 'INR'
        });

        if (error) {
            setError(error.message || 'Failed to update settings.');
        } else {
            setSettings(data);
            await refreshSettings();
            setSuccess('Store settings updated successfully.');
            setTimeout(() => setSuccess(''), 4000);
        }
        setSaving(false);
    }

    if (loading) return <PageLoader />;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Store Settings</h1>
            </div>

            <div className={styles.mainLayout}>
                {error && (
                    <div className="alert alert--danger mb-md" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="alert alert--success mb-md" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {settings && (
                    <form onSubmit={handleSubmit} noValidate>

                        {/* A. Shipping Setup Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Truck size={20} className={styles.cardTitleIcon} />
                                    Shipping Defaults
                                </h2>
                                <p className={styles.cardDesc}>Configure base shipping fees and conditions for free shipping.</p>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formRow}>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Base Shipping Fee</label>
                                        <div className={styles.inputGroup}>
                                            <span className={styles.inputPrefix}>₹</span>
                                            <input
                                                type="number"
                                                className={`form-input ${styles.inputWithPrefix}`}
                                                value={settings.shipping_fee}
                                                onChange={e => handleChange('shipping_fee', Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Free Shipping Threshold</label>
                                        <div className={styles.inputGroup}>
                                            <span className={styles.inputPrefix}>₹</span>
                                            <input
                                                type="number"
                                                className={`form-input ${styles.inputWithPrefix}`}
                                                value={settings.free_shipping_threshold}
                                                onChange={e => handleChange('free_shipping_threshold', Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>
                                        <span className={styles.inputHelp}>
                                            Orders over this subtotal automatically receive free standard shipping.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* B. Offers Config Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Tag size={20} className={styles.cardTitleIcon} />
                                    Global Offers
                                </h2>
                                <p className={styles.cardDesc}>Manage store-wide discount behavior and tagging.</p>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.toggleWrapper}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Enable Global Tagging</span>
                                        <span className={styles.toggleDesc}>Turns on site-wide offer badging functionality.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.enable_global_offers || false}
                                            onChange={e => handleChange('enable_global_offers', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div className={styles.formCol} style={{ maxWidth: '300px' }}>
                                    <label className="form-label">Default Global Discount (%)</label>
                                    <div className={styles.inputGroup}>
                                        <span className={styles.inputPrefix}>%</span>
                                        <input
                                            type="number"
                                            className={`form-input ${styles.inputWithPrefix}`}
                                            value={settings.default_offer_percentage}
                                            onChange={e => handleChange('default_offer_percentage', Number(e.target.value))}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* C. Taxation Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Percent size={20} className={styles.cardTitleIcon} />
                                    Tax Options
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.toggleWrapper}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Charge Tax at Checkout</span>
                                        <span className={styles.toggleDesc}>Automatically calculate and add tax to order subtotals.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.enable_tax_calculation || false}
                                            onChange={e => handleChange('enable_tax_calculation', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div className={styles.formCol} style={{ maxWidth: '300px' }}>
                                    <label className="form-label">Tax Rate (%)</label>
                                    <div className={styles.inputGroup}>
                                        <span className={styles.inputPrefix}>%</span>
                                        <input
                                            type="number"
                                            className={`form-input ${styles.inputWithPrefix}`}
                                            value={settings.tax_percentage}
                                            onChange={e => handleChange('tax_percentage', Number(e.target.value))}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* D. Returns Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <RotateCcw size={20} className={styles.cardTitleIcon} />
                                    Returns Policy
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formCol} style={{ maxWidth: '300px' }}>
                                    <label className="form-label">Return Window (Days)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings.return_period_days}
                                        onChange={e => handleChange('return_period_days', Number(e.target.value))}
                                        min="1"
                                    />
                                    <span className={styles.inputHelp}>
                                        Displayed dynamically on product detail pages.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* E. Store Config Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Globe size={20} className={styles.cardTitleIcon} />
                                    Localization
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formCol} style={{ maxWidth: '300px' }}>
                                    <label className="form-label">Base Currency</label>
                                    <select
                                        className="form-input"
                                        value={settings.currency || 'INR'}
                                        onChange={e => handleChange('currency', e.target.value)}
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                    <span className={styles.inputHelp}>
                                        The operating currency of the storefront checkout.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Global Actions */}
                        <div className={styles.actionsBar}>
                            <button type="submit" className={`btn btn--primary ${styles.saveBtn}`} disabled={saving}>
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
}
