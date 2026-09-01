import { createContext, useContext, useEffect, useReducer } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'jersey_store_cart';

function loadCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveCart(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function cartReducer(state, action) {
    let newState;

    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.find(
                (item) =>
                    item.id === action.payload.id && item.size === action.payload.size
            );
            if (existing) {
                newState = state.map((item) =>
                    item.id === action.payload.id && item.size === action.payload.size
                        ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
                        : item
                );
            } else {
                newState = [...state, { ...action.payload, quantity: action.payload.quantity || 1 }];
            }
            break;
        }
        case 'REMOVE_ITEM':
            newState = state.filter(
                (item) =>
                    !(item.id === action.payload.id && item.size === action.payload.size)
            );
            break;
        case 'UPDATE_QUANTITY':
            if (action.payload.quantity <= 0) {
                newState = state.filter(
                    (item) =>
                        !(item.id === action.payload.id && item.size === action.payload.size)
                );
            } else {
                newState = state.map((item) =>
                    item.id === action.payload.id && item.size === action.payload.size
                        ? { ...item, quantity: action.payload.quantity }
                        : item
                );
            }
            break;
        case 'CLEAR_CART':
            newState = [];
            break;
        default:
            return state;
    }

    saveCart(newState);
    return newState;
}

export function CartProvider({ children }) {
    const [items, dispatch] = useReducer(cartReducer, [], loadCart);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    function addItem(product, size, quantity = 1) {
        dispatch({
            type: 'ADD_ITEM',
            payload: {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0] || product.image,
                size,
                quantity,
                slug: product.slug,
            },
        });
    }

    function removeItem(id, size) {
        dispatch({ type: 'REMOVE_ITEM', payload: { id, size } });
    }

    function updateQuantity(id, size, quantity) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, quantity } });
    }

    function clearCart() {
        dispatch({ type: 'CLEAR_CART' });
    }

    function isInCart(id, size) {
        return items.some((item) => item.id === id && item.size === size);
    }

    const value = {
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
