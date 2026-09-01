import { createContext, useContext, useEffect, useReducer } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

function wishlistReducer(state, action) {
    switch (action.type) {
        case 'SET':
            return action.payload;
        case 'ADD':
            if (state.some((item) => item.product_id === action.payload.product_id)) {
                return state;
            }
            return [...state, action.payload];
        case 'REMOVE':
            return state.filter((item) => item.product_id !== action.payload);
        case 'CLEAR':
            return [];
        default:
            return state;
    }
}

export function WishlistProvider({ children }) {
    const [items, dispatch] = useReducer(wishlistReducer, []);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            dispatch({ type: 'CLEAR' });
        }
    }, [user]);

    async function fetchWishlist() {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .select('*, products(*)')
                .eq('user_id', user.id);
            if (error) throw error;
            dispatch({ type: 'SET', payload: data || [] });
        } catch (err) {
            console.error('Error fetching wishlist:', err);
        }
    }

    async function addToWishlist(productId) {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .insert({ user_id: user.id, product_id: productId })
                .select('*, products(*)')
                .single();
            if (error) throw error;
            dispatch({ type: 'ADD', payload: data });
            return { data };
        } catch (err) {
            return { error: err };
        }
    }

    async function removeFromWishlist(productId) {
        if (!user) return { error: 'Not authenticated' };
        try {
            const { error } = await supabase
                .from('wishlists')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
            if (error) throw error;
            dispatch({ type: 'REMOVE', payload: productId });
            return {};
        } catch (err) {
            return { error: err };
        }
    }

    function isWishlisted(productId) {
        return items.some((item) => item.product_id === productId);
    }

    const value = {
        items,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        fetchWishlist,
    };

    return (
        <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
