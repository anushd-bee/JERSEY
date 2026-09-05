let currentCurrency = 'INR';

export function setGlobalCurrency(currencyCode) {
    if (currencyCode) currentCurrency = currencyCode;
}

export function formatPrice(amount, currencyCode = currentCurrency) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
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
