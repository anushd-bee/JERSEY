import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle, Truck, Tag, Percent, RotateCcw, Globe, Info } from 'lucide-react';
import { storeSettingsService } from '../../services/storeSettingsService';
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from '../../utils/helpers';
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
        try {
            const { data, error } = await storeSettingsService.getSettings();
            if (error) {
                setError('Failed to load database settings. Creating defaults...');
            }

            // Strictly normalize incoming data, ensuring numeric 0 is preserved
            // and strings are trimmed to prevent invisible validation bypass failures.
            setSettings({
                id: data?.id || undefined,
                store_name: data?.store_name?.trim() || 'Jersey Store',
                currency_code: (data?.currency_code || 'INR').trim().toUpperCase(),
                currency_symbol: (data?.currency_symbol || '₹').trim(),
                shipping_fee: data?.shipping_fee ?? 50,
                free_shipping_threshold: data?.free_shipping_threshold ?? 999,
                free_shipping_enabled: data?.free_shipping_enabled ?? true,
                global_offer_enabled: data?.global_offer_enabled ?? false,
                default_offer_percentage: data?.default_offer_percentage ?? 0,
                tax_enabled: data?.tax_enabled ?? false,
                tax_percentage: data?.tax_percentage ?? 0,
                return_enabled: data?.return_enabled ?? true,
                return_period_days: data?.return_period_days ?? 15
            });
        } catch (err) {
            console.error(err);
            setError('Runtime exception connecting to settings service.');
        } finally {
            setLoading(false);
        }
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!settings.store_name?.trim()) return 'Store name is required.';
        if (settings.shipping_fee < 0 || isNaN(settings.shipping_fee)) return 'Shipping fee must be 0 or greater.';
        if (settings.free_shipping_threshold < 0 || isNaN(settings.free_shipping_threshold)) return 'Free shipping threshold cannot be negative.';
        if (settings.default_offer_percentage < 0 || settings.default_offer_percentage > 100 || isNaN(settings.default_offer_percentage)) return 'Offer percentage must be between 0 and 100.';
        if (settings.tax_percentage < 0 || settings.tax_percentage > 100 || isNaN(settings.tax_percentage)) return 'Tax percentage must be between 0 and 100.';
        if (settings.return_period_days < 0 || isNaN(settings.return_period_days)) return 'Return period cannot be negative.';
        if (!isSupportedCurrency(settings.currency_code)) return `Currency code must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`;
        if (!settings.currency_symbol?.trim()) return 'Currency symbol is required.';
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
        // Coerce strictly to types and trim spaces from string values
        const updates = {
            store_name: settings.store_name.trim(),
            currency_code: settings.currency_code.trim().toUpperCase(),
            currency_symbol: settings.currency_symbol.trim(),
            shipping_fee: Number(settings.shipping_fee) || 0, // Catch NaN
            free_shipping_threshold: Number(settings.free_shipping_threshold) || 0,
            free_shipping_enabled: Boolean(settings.free_shipping_enabled),
            global_offer_enabled: Boolean(settings.global_offer_enabled),
            default_offer_percentage: Number(settings.default_offer_percentage) || 0,
            tax_enabled: Boolean(settings.tax_enabled),
            tax_percentage: Number(settings.tax_percentage) || 0,
            return_enabled: Boolean(settings.return_enabled),
            return_period_days: Number(settings.return_period_days) || 0
        };

        const { data, error } = await storeSettingsService.updateSettings(updates);

        if (error) {
            setError(error.message || 'Failed to update settings. Verify RLS policies and table schema.');
        } else {
            // Instantly refresh UI state with normalized DB response
            setSettings({
                id: data?.id,
                store_name: data?.store_name || updates.store_name,
                currency_code: data?.currency_code || updates.currency_code,
                currency_symbol: data?.currency_symbol || updates.currency_symbol,
                shipping_fee: data?.shipping_fee ?? updates.shipping_fee,
                free_shipping_threshold: data?.free_shipping_threshold ?? updates.free_shipping_threshold,
                free_shipping_enabled: data?.free_shipping_enabled ?? updates.free_shipping_enabled,
                global_offer_enabled: data?.global_offer_enabled ?? updates.global_offer_enabled,
                default_offer_percentage: data?.default_offer_percentage ?? updates.default_offer_percentage,
                tax_enabled: data?.tax_enabled ?? updates.tax_enabled,
                tax_percentage: data?.tax_percentage ?? updates.tax_percentage,
                return_enabled: data?.return_enabled ?? updates.return_enabled,
                return_period_days: data?.return_period_days ?? updates.return_period_days
            });
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
                                    Shipping & Delivery
                                </h2>
                                <p className={styles.cardDesc}>Configure base shipping fees and conditions for free shipping.</p>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.toggleWrapper}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Enable Free Shipping Rule</span>
                                        <span className={styles.toggleDesc}>When disabled, the base shipping fee always applies.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.free_shipping_enabled}
                                            onChange={e => handleChange('free_shipping_enabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Base Shipping Fee</label>
                                        <div className={styles.inputGroup}>
                                            <span className={styles.inputPrefix}>{settings.currency_symbol}</span>
                                            <input
                                                type="number"
                                                className={`form-input ${styles.inputWithPrefix}`}
                                                value={settings.shipping_fee}
                                                onChange={e => handleChange('shipping_fee', e.target.value)}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Free Shipping Threshold</label>
                                        <div className={styles.inputGroup}>
                                            <span className={styles.inputPrefix}>{settings.currency_symbol}</span>
                                            <input
                                                type="number"
                                                className={`form-input ${styles.inputWithPrefix}`}
                                                value={settings.free_shipping_threshold}
                                                onChange={e => handleChange('free_shipping_threshold', e.target.value)}
                                                min="0"
                                                disabled={!settings.free_shipping_enabled}
                                            />
                                        </div>
                                        <span className={styles.inputHelp}>
                                            Orders over this subtotal automatically receive free standard shipping.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* B. Currency */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Globe size={20} className={styles.cardTitleIcon} />
                                    Currency
                                </h2>
                                <p className={styles.cardDesc}>Storefront formatting defaults.</p>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formRow}>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Currency Code</label>
                                        <select
                                            className="form-input"
                                            value={settings.currency_code}
                                            onChange={e => handleChange('currency_code', e.target.value)}
                                        >
                                            {SUPPORTED_CURRENCIES.map(code => (
                                                <option key={code} value={code}>{code}</option>
                                            ))}
                                        </select>
                                        <span className={styles.inputHelp}>
                                            Only currencies the storefront knows how to format are selectable.
                                        </span>
                                    </div>
                                    <div className={styles.formCol}>
                                        <label className="form-label">Currency Symbol</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={settings.currency_symbol}
                                            onChange={e => handleChange('currency_symbol', e.target.value)}
                                            placeholder="₹"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* C. Offers & Discounts */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Tag size={20} className={styles.cardTitleIcon} />
                                    Offers & Discounts
                                </h2>
                                <p className={styles.cardDesc}>Manage store-wide discount behavior.</p>
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
                                            checked={settings.global_offer_enabled}
                                            onChange={e => handleChange('global_offer_enabled', e.target.checked)}
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
                                            onChange={e => handleChange('default_offer_percentage', e.target.value)}
                                            min="0"
                                            max="100"
                                            disabled={!settings.global_offer_enabled}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* D. Tax Card */}
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
                                            checked={settings.tax_enabled}
                                            onChange={e => handleChange('tax_enabled', e.target.checked)}
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
                                            onChange={e => handleChange('tax_percentage', e.target.value)}
                                            min="0"
                                            max="100"
                                            disabled={!settings.tax_enabled}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* E. Returns Card */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <RotateCcw size={20} className={styles.cardTitleIcon} />
                                    Returns Policy
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.toggleWrapper}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Enable Returns</span>
                                        <span className={styles.toggleDesc}>Show return period details on the product page.</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={settings.return_enabled}
                                            onChange={e => handleChange('return_enabled', e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                <div className={styles.formCol} style={{ maxWidth: '300px' }}>
                                    <label className="form-label">Return Window (Days)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={settings.return_period_days}
                                        onChange={e => handleChange('return_period_days', e.target.value)}
                                        min="0"
                                        disabled={!settings.return_enabled}
                                    />
                                    <span className={styles.inputHelp}>
                                        Displayed dynamically on product detail pages.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* F. Store Information */}
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>
                                    <Info size={20} className={styles.cardTitleIcon} />
                                    Store Information
                                </h2>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.formCol}>
                                    <label className="form-label">Store Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={settings.store_name}
                                        onChange={e => handleChange('store_name', e.target.value)}
                                    />
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
