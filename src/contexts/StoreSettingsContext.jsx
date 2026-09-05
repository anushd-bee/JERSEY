import { createContext, useContext, useEffect, useState } from 'react';
import { storeSettingsService } from '../services/storeSettingsService';

const StoreSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
    shipping_fee: 99,
    free_shipping_threshold: 999,
    offer_enabled: false,
    default_offer_percentage: 0,
    tax_enabled: false,
    tax_percentage: 0,
    return_period_days: 15,
};

export function StoreSettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    async function loadSettings() {
        setLoading(true);
        const { data } = await storeSettingsService.getSettings();
        if (data) {
            setSettings({
                ...DEFAULT_SETTINGS,
                ...data,
                shipping_fee: data.shipping_fee !== null ? Number(data.shipping_fee) : DEFAULT_SETTINGS.shipping_fee,
                free_shipping_threshold: data.free_shipping_threshold !== null ? Number(data.free_shipping_threshold) : DEFAULT_SETTINGS.free_shipping_threshold,
                default_offer_percentage: data.default_offer_percentage !== null ? Number(data.default_offer_percentage) : DEFAULT_SETTINGS.default_offer_percentage,
                tax_percentage: data.tax_percentage !== null ? Number(data.tax_percentage) : DEFAULT_SETTINGS.tax_percentage,
                return_period_days: data.return_period_days !== null ? Number(data.return_period_days) : DEFAULT_SETTINGS.return_period_days
            });
        }
        setLoading(false);
    }

    useEffect(() => {
        loadSettings();
    }, []);

    const value = {
        settings,
        loading,
        refreshSettings: loadSettings
    };

    return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
    const context = useContext(StoreSettingsContext);
    if (!context) {
        throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
    }
    return context;
}
