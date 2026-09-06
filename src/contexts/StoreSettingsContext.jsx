import { createContext, useContext, useEffect, useState } from 'react';
import { storeSettingsService } from '../services/storeSettingsService';

import { setGlobalCurrency } from '../utils/helpers';

const StoreSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
    store_name: 'Jersey Store',
    currency_code: 'INR',
    currency_symbol: '₹',
    shipping_fee: 50,
    free_shipping_threshold: 999,
    free_shipping_enabled: true,
    global_offer_enabled: false,
    default_offer_percentage: 0,
    tax_enabled: false,
    tax_percentage: 0,
    return_enabled: true,
    return_period_days: 15
};

export function StoreSettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    async function loadSettings() {
        setLoading(true);
        try {
            const { data } = await storeSettingsService.getSettings();
            if (data) {
                const newSettings = {
                    ...DEFAULT_SETTINGS,
                    ...data,
                    store_name: data.store_name || DEFAULT_SETTINGS.store_name,
                    currency_code: data.currency_code || DEFAULT_SETTINGS.currency_code,
                    currency_symbol: data.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
                    shipping_fee: data.shipping_fee ?? DEFAULT_SETTINGS.shipping_fee,
                    free_shipping_threshold: data.free_shipping_threshold ?? DEFAULT_SETTINGS.free_shipping_threshold,
                    free_shipping_enabled: data.free_shipping_enabled ?? DEFAULT_SETTINGS.free_shipping_enabled,
                    global_offer_enabled: data.global_offer_enabled ?? DEFAULT_SETTINGS.global_offer_enabled,
                    default_offer_percentage: data.default_offer_percentage ?? DEFAULT_SETTINGS.default_offer_percentage,
                    tax_enabled: data.tax_enabled ?? DEFAULT_SETTINGS.tax_enabled,
                    tax_percentage: data.tax_percentage ?? DEFAULT_SETTINGS.tax_percentage,
                    return_enabled: data.return_enabled ?? DEFAULT_SETTINGS.return_enabled,
                    return_period_days: data.return_period_days ?? DEFAULT_SETTINGS.return_period_days
                };
                setSettings(newSettings);
                setGlobalCurrency(newSettings.currency_code);
            }
        } catch (err) {
            console.error("Failed to load settings:", err);
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
