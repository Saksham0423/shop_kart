import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    useEffect(() => {
        const fetchOrder = async () => {
            setLoading(true);
            setError('');
            try {
                const [customerRes, orderRes] = await Promise.all([
                    api.get('/customers/me'),
                    api.get(`/orders/${id}`)
                ]);
                setCustomer(customerRes.data);
                setOrder(orderRes.data?.order);
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
                setError(err.response?.data?.message || 'Failed to load order details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrder();
        }
    }, [id, navigate]);

    const steps = ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentStepIndex = steps.indexOf(order?.status || 'PLACED');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Link to="/orders" className="hover:text-indigo-600">
                            My Orders
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-slate-900">Order Details</span>
                    </div>

                    <Link
                        to="/orders"
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        ← Back to Orders
                    </Link>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-medium text-slate-500">Loading order details...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                        <h3 className="text-lg font-bold text-red-800">{error}</h3>
                        <Link
                            to="/orders"
                            className="mt-4 inline-block rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                            Return to Orders
                        </Link>
                    </div>
                )}

                {!loading && !error && order && (
                    <div className="space-y-6">
                        {/* Header Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
                                <div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Order ID
                                    </span>
                                    <h1 className="font-mono text-xl font-extrabold text-slate-900">
                                        {order._id}
                                    </h1>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Placed on{' '}
                                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className="flex flex-col items-end gap-1.5">
                                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-extrabold text-indigo-800">
                                        {order.status}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        Payment: {order.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {/* Status Timeline */}
                            <div className="pt-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                    Delivery Status Progression
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                                        const stepIndex = steps.indexOf(step);
                                        const isReached = currentStepIndex >= stepIndex;
                                        return (
                                            <div
                                                key={step}
                                                className={`rounded-xl border p-3 text-center transition ${
                                                    isReached
                                                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                                                        : 'border-slate-200 bg-slate-50/50 text-slate-400'
                                                }`}
                                            >
                                                <span className="text-xs font-medium block">Step {idx + 1}</span>
                                                <span className="text-sm">{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">Items in Order</h2>
                            <div className="divide-y divide-slate-100">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-16 w-16 rounded-xl object-cover border border-slate-100"
                                                />
                                            ) : (
                                                <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                                    No img
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                                <p className="text-sm text-slate-500">
                                                    Quantity: {item.quantity} × {formatPrice(item.price)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-extrabold text-slate-900">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-base font-extrabold text-slate-900">
                                <span>Grand Total</span>
                                <span className="text-xl text-indigo-600">{formatPrice(order.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Shipping & Payment Meta */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900 mb-3">Shipping Address</h3>
                                {order.shippingAddress ? (
                                    <div className="text-sm text-slate-600 space-y-1">
                                        <p className="font-semibold text-slate-900">
                                            {order.shippingAddress.fullName}
                                        </p>
                                        <p>{order.shippingAddress.phone}</p>
                                        <p>{order.shippingAddress.addressLine1}</p>
                                        <p>
                                            {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                                            {order.shippingAddress.pincode}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500">No shipping address recorded.</p>
                                )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="text-base font-bold text-slate-900 mb-3">Payment Info</h3>
                                <div className="text-sm text-slate-600 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Payment Status:</span>
                                        <span className="font-bold text-emerald-600">{order.paymentStatus}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Method:</span>
                                        <span className="font-medium text-slate-900">Razorpay Standard</span>
                                    </div>
                                    {order.razorpayOrderId && (
                                        <div className="flex justify-between text-xs">
                                            <span>Razorpay Order:</span>
                                            <span className="font-mono text-slate-800">{order.razorpayOrderId}</span>
                                        </div>
                                    )}
                                    {order.razorpayPaymentId && (
                                        <div className="flex justify-between text-xs">
                                            <span>Payment ID:</span>
                                            <span className="font-mono text-slate-800">{order.razorpayPaymentId}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default OrderDetails;
