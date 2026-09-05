import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { storeSettingsService } from '../../services/storeSettingsService';
import { PageLoader } from '../../components/Loading/Loading';
import styles from '../Dashboard/Dashboard.module.css';

export default function AdminSettings() {
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
                offer_enabled: false,
                default_offer_percentage: 0,
                tax_enabled: false,
                tax_percentage: 0,
                return_period_days: 15
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
            offer_enabled: settings.offer_enabled,
            default_offer_percentage: settings.default_offer_percentage,
            tax_enabled: settings.tax_enabled,
            tax_percentage: settings.tax_percentage,
            return_period_days: settings.return_period_days
        });

        if (error) {
            setError(error.message || 'Failed to update settings.');
        } else {
            setSettings(data);
            setSuccess('Store settings updated successfully.');
            setTimeout(() => setSuccess(''), 3000);
        }
        setSaving(false);
    }

    if (loading) return <PageLoader />;

    return (
        <>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Store Settings</h1>
            </div>

            <div className={styles.section} style={{ maxWidth: 800 }}>
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

                    <form onSubmit={handleSubmit} className="custom-form">
                        <div className="form-group row">
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Shipping Fee (₹)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.shipping_fee}
                                    onChange={e => handleChange('shipping_fee', Number(e.target.value))}
                                    min="0"
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Free Shipping Threshold (₹)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.free_shipping_threshold}
                                    onChange={e => handleChange('free_shipping_threshold', Number(e.target.value))}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group row">
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Default Offer Percentage (%)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.default_offer_percentage}
                                    onChange={e => handleChange('default_offer_percentage', Number(e.target.value))}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.offer_enabled}
                                        onChange={e => handleChange('offer_enabled', e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>Enable Global Offers</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group row">
                            <div style={{ flex: 1 }}>
                                <label className="form-label">Tax Percentage (%)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.tax_percentage}
                                    onChange={e => handleChange('tax_percentage', Number(e.target.value))}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={settings.tax_enabled}
                                        onChange={e => handleChange('tax_enabled', e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>Enable Tax Calculation</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Return Period (Days)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={settings.return_period_days}
                                onChange={e => handleChange('return_period_days', Number(e.target.value))}
                                min="1"
                                style={{ maxWidth: 200 }}
                                required
                            />
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button type="submit" className="btn btn--primary" disabled={saving}>
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}
