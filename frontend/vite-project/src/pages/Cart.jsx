import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from '../components/CartItem';
import Navbar from '../components/Navbar';
import { useCart } from '../context/useCart';
import api from '../services/api';

function Cart() {
    const [customer, setCustomer] = useState(null);
    const { cartItems, error, loading, refreshCart, subtotal, totalUnits } = useCart();

    const formatPrice = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/customers/me');
                setCustomer(res.data);
            } catch {
                setCustomer(null);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    My Cart
                </h1>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-semibold text-slate-600">Loading your cart...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
                        <h3 className="text-lg font-bold text-red-800">Unable to load your cart.</h3>
                        <button
                            type="button"
                            onClick={() => refreshCart().catch(() => undefined)}
                            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && cartItems.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Your cart is empty</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Looks like you haven't added anything yet.
                        </p>
                        <Link
                            to="/products"
                            className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Browse Products
                        </Link>
                    </div>
                )}

                {!loading && !error && cartItems.length > 0 && (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
                        <section className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6">
                            {cartItems.map((item) => (
                                <CartItem
                                    key={item.product?._id || item._id}
                                    item={item}
                                />
                            ))}
                        </section>

                        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Items</span>
                                    <span className="font-semibold text-slate-900">{totalUnits}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                                    <span>Subtotal</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                            </div>

                            <Link
                                to="/checkout"
                                className="mt-6 block w-full text-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                            >
                                Proceed to Checkout
                            </Link>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Cart;
