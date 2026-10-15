import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function OrderSuccess() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState(null);

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    useEffect(() => {
        const fetchOrderAndCustomer = async () => {
            try {
                const [orderRes, customerRes] = await Promise.allSettled([
                    api.get(`/orders/${id}`),
                    api.get('/customers/me')
                ]);

                if (orderRes.status === 'fulfilled') {
                    setOrder(orderRes.value.data.order);
                }
                if (customerRes.status === 'fulfilled') {
                    setCustomer(customerRes.value.data);
                }
            } catch (err) {
                console.error('Failed to load order confirmation details', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderAndCustomer();
        }
    }, [id]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 shadow-inner">
                        ✓
                    </div>

                    <h1 className="mt-5 text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Order Placed Successfully
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Your order has been saved successfully.
                    </p>

                    {loading ? (
                        <div className="py-8 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3 gap-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Order ID
                                </span>
                                <span className="font-mono text-sm font-bold text-slate-800 break-all">
                                    {order?._id || id}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Status
                                </span>
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                    {order?.status || 'PLACED'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Payment Status
                                </span>
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                                    {order?.paymentStatus || 'PAID'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-sm font-bold text-slate-700">Total Paid</span>
                                <span className="text-lg font-extrabold text-slate-900">
                                    {order?.totalAmount ? formatPrice(order.totalAmount) : ''}
                                </span>
                            </div>

                            {order?.shippingAddress && (
                                <div className="mt-4 border-t border-slate-200/80 pt-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Delivery Address
                                    </span>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {order.shippingAddress.fullName} • {order.shippingAddress.phone}
                                        <br />
                                        {order.shippingAddress.addressLine1}, {order.shippingAddress.city},{' '}
                                        {order.shippingAddress.state} - {order.shippingAddress.pincode}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/orders"
                            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 text-center"
                        >
                            View My Orders
                        </Link>
                        <Link
                            to="/products"
                            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 text-center"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default OrderSuccess;
