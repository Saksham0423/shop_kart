import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import api from '../services/api';

function Wishlist() {
    const [wishlist, setWishlist] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const fetchWishlist = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.get('/wishlist');
            setWishlist(res.data.wishlist || []);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            fetchWishlist();
        }, 0);

        return () => clearTimeout(timerId);
    }, []);

    const handleRemoved = (productId) => {
        setWishlist((prev) => prev.filter((p) => p._id !== productId));
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        My Wishlist
                    </h1>
                    {!loading && !error && wishlist.length > 0 && (
                        <p className="text-slate-500">
                            {wishlist.length} {wishlist.length === 1 ? 'product' : 'products'} saved
                        </p>
                    )}
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-semibold text-slate-600">Loading your wishlist...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
                        <span className="text-4xl">⚠️</span>
                        <h3 className="mt-3 text-lg font-bold text-red-800">Unable to load wishlist.</h3>
                        <button
                            onClick={fetchWishlist}
                            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && wishlist.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                        <span className="text-5xl">❤️</span>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">Your wishlist is empty</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Save products you love and find them here later.
                        </p>
                        <Link
                            to="/products"
                            className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Browse Products
                        </Link>
                    </div>
                )}

                {!loading && !error && wishlist.length > 0 && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {wishlist.map((product) => (
                            <WishlistCard
                                key={product._id}
                                product={product}
                                onRemoved={handleRemoved}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Wishlist;
