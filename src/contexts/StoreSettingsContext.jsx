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
                shipping_fee: Number(data.shipping_fee) || 0,
                free_shipping_threshold: Number(data.free_shipping_threshold) || 0,
                default_offer_percentage: Number(data.default_offer_percentage) || 0,
                tax_percentage: Number(data.tax_percentage) || 0,
                return_period_days: Number(data.return_period_days) || 15
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
