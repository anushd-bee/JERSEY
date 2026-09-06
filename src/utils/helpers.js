let currentCurrency = 'INR';

// A safe, known-supported subset of ISO 4217 codes. Anything outside this
// list falls back to INR rather than throwing and taking down price
// rendering across the whole site.
export const SUPPORTED_CURRENCIES = [
    'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'JPY', 'CNY',
];

export function isSupportedCurrency(currencyCode) {
    return SUPPORTED_CURRENCIES.includes(String(currencyCode || '').toUpperCase());
}

export function setGlobalCurrency(currencyCode) {
    if (currencyCode && isSupportedCurrency(currencyCode)) {
        currentCurrency = currencyCode.toUpperCase();
    } else if (currencyCode) {
        console.warn(`Unsupported currency code "${currencyCode}" — falling back to INR.`);
        currentCurrency = 'INR';
    }
}

export function formatPrice(amount, currencyCode = currentCurrency) {
    const safeCode = isSupportedCurrency(currencyCode) ? currencyCode.toUpperCase() : 'INR';
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: safeCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        // Last-resort fallback — never let a bad currency code crash rendering.
        return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    }
}

export function formatDate(dateString) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(dateString));
}

export function formatDateTime(dateString) {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
}

export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

export function truncate(str, maxLength = 100) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength).trimEnd() + '…';
}

export function classNames(...args) {
    return args.filter(Boolean).join(' ');
}

export function getOrderStatusColor(status) {
    const colors = {
        pending: 'warning',
        confirmed: 'info',
        processing: 'info',
        shipped: 'info',
        delivered: 'success',
        cancelled: 'danger',
        refunded: 'danger',
    };
    return colors[status] || 'default';
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
