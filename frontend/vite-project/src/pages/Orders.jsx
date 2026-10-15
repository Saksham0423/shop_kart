import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [customer, setCustomer] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    const fetchOrders = async () => {
        setLoading(true);
        setError('');
        try {
            const [customerRes, ordersRes] = await Promise.all([
                api.get('/customers/me'),
                api.get('/orders')
            ]);
            setCustomer(customerRes.data);
            setOrders(ordersRes.data?.orders || []);
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
            setError(err.response?.data?.message || 'Failed to load your orders.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [navigate]);

    // Bonus feature: development status updater
    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            if (res.data.success) {
                setOrders((prev) =>
                    prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
                );
            }
        } catch (err) {
            console.error('Failed to update status', err);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DELIVERED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'SHIPPED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CONFIRMED':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'PLACED':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default:
                return 'bg-amber-100 text-amber-800 border-amber-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                            My Orders
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Check the status of recent orders and view purchase history.
                        </p>
                    </div>
                    <Link
                        to="/products"
                        className="hidden sm:inline-block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Browse Catalogue
                    </Link>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-medium text-slate-500">Loading your orders...</p>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                            ⚠️
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-red-800">{error}</h3>
                        <p className="mt-1 text-sm text-red-600">
                            We were unable to retrieve your order history at this time.
                        </p>
                        <button
                            type="button"
                            onClick={fetchOrders}
                            className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && orders.length === 0 && (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                            📦
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-slate-900">
                            You have not placed any orders yet.
                        </h3>
                        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
                            When you make a purchase, your orders and tracking details will appear here.
                        </p>
                        <Link
                            to="/products"
                            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}

                {/* Orders List */}
                {!loading && !error && orders.length > 0 && (
                    <div className="mt-8 space-y-6">
                        {orders.map((order) => {
                            const dateStr = order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString('en-GB', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                  })
                                : '';

                            return (
                                <div
                                    key={order._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                >
                                    {/* Order Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/75 px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                    Order Placed
                                                </p>
                                                <p className="text-sm font-semibold text-slate-800">{dateStr}</p>
                                            </div>
                                            <div className="border-l border-slate-200 pl-4">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                    Order #
                                                </p>
                                                <p className="font-mono text-sm font-bold text-slate-800">
                                                    {order._id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadge(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>

                                            <Link
                                                to={`/orders/${order._id}`}
                                                className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Order Body */}
                                    <div className="p-6">
                                        <div className="divide-y divide-slate-100">
                                            {order.items?.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-12 w-12 rounded-xl object-cover border border-slate-100"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                                                No img
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Qty: {item.quantity} × {formatPrice(item.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Order Footer & Total */}
                                        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 uppercase font-semibold">
                                                    Status Progression:
                                                </span>
                                                <select
                                                    value={order.status}
                                                    disabled={updatingOrderId === order._id}
                                                    onChange={(e) =>
                                                        handleStatusChange(order._id, e.target.value)
                                                    }
                                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
                                                    title="Bonus Challenge: Advance order status"
                                                >
                                                    <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                                                    <option value="PLACED">PLACED</option>
                                                    <option value="CONFIRMED">CONFIRMED</option>
                                                    <option value="SHIPPED">SHIPPED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                </select>
                                                {updatingOrderId === order._id && (
                                                    <span className="text-xs text-indigo-600 animate-pulse">
                                                        Updating...
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    Total Amount:{' '}
                                                </span>
                                                <span className="text-lg font-extrabold text-slate-900">
                                                    {formatPrice(order.totalAmount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Orders;
