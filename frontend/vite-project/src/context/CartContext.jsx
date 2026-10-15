import { useCallback, useEffect, useMemo, useState } from 'react';
import CartContext from './CartContextStore';
import api from '../services/api';

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const applyCart = (cart) => {
        setCartItems(Array.isArray(cart) ? cart : []);
    };

    const refreshCart = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('/cart');
            applyCart(response.data.cart);
            return response.data.cart;
        } catch (err) {
            applyCart([]);
            setError(err.response?.data?.message || 'Unable to load your cart.');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addToCart = useCallback(async (productId) => {
        setError('');
        const response = await api.post(`/cart/${productId}`);
        applyCart(response.data.cart);
        return response.data.cart;
    }, []);

    const updateQuantity = useCallback(async (productId, quantity) => {
        setError('');
        const response = await api.patch(`/cart/${productId}`, { quantity });
        applyCart(response.data.cart);
        return response.data.cart;
    }, []);

    const removeFromCart = useCallback(async (productId) => {
        setError('');
        const response = await api.delete(`/cart/${productId}`);
        applyCart(response.data.cart);
        return response.data.cart;
    }, []);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            refreshCart().catch(() => undefined);
        }, 0);

        return () => clearTimeout(timerId);
    }, [refreshCart]);

    const totalUnits = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
    const subtotal = cartItems.reduce((total, item) => {
        return total + Number(item.product?.price || 0) * Number(item.quantity || 0);
    }, 0);

    const value = useMemo(() => ({
        cartItems,
        loading,
        error,
        totalUnits,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart
    }), [cartItems, loading, error, totalUnits, subtotal, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
