import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/useCart';
import api from '../services/api';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function Checkout() {
    const navigate = useNavigate();
    const { cartItems, totalUnits, subtotal, clearCart, loading: cartLoading } = useCart();

    const [customer, setCustomer] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [errors, setErrors] = useState({});

    const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/customers/me');
                setCustomer(res.data);
                if (res.data) {
                    setFormData((prev) => ({
                        ...prev,
                        fullName: res.data.fullName || '',
                        phone: res.data.phone || ''
                    }));
                }
            } catch {
                navigate('/login');
            } finally {
                setPageLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full Name is required';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else {
            const digits = formData.phone.trim().replace(/\D/g, '');
            if (digits.length < 10) {
                newErrors.phone = 'Phone number must be at least 10 digits';
            }
        }

        if (!formData.addressLine1.trim()) {
            newErrors.addressLine1 = 'Address line is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
            newErrors.pincode = 'Pincode must contain 6 digits.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setApiError('');

        if (!validateForm()) {
            return;
        }

        if (!cartItems || cartItems.length === 0) {
            setApiError('Your cart is empty. Add products to continue.');
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Create ShopKart Pending Order and Razorpay Order on server
            const orderRes = await api.post('/orders/create-payment-order', {
                shippingAddress: {
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim(),
                    addressLine1: formData.addressLine1.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    pincode: formData.pincode.trim()
                }
            });

            const checkoutData = orderRes.data;

            // Step 2: Load Razorpay SDK
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setApiError('Failed to load Razorpay payment SDK. Please check your internet connection.');
                setSubmitting(false);
                return;
            }

            // Step 3: Open Razorpay Checkout modal
            const options = {
                key: checkoutData.key,
                amount: checkoutData.amount,
                currency: checkoutData.currency || 'INR',
                name: 'ShopKart',
                description: 'ShopKart Purchase Order',
                order_id: checkoutData.razorpayOrderId,
                handler: async function (paymentResponse) {
                    try {
                        setSubmitting(true);
                        // Step 4: Verify payment signature on backend
                        const verifyRes = await api.post('/orders/verify-payment', {
                            shopKartOrderId: checkoutData.shopKartOrderId,
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            // Step 5: Clear global cart state in React context
                            clearCart();
                            // Step 6: Navigate to order confirmation
                            navigate(`/order-success/${checkoutData.shopKartOrderId}`);
                        } else {
                            setApiError(verifyRes.data.message || 'Payment verification failed.');
                        }
                    } catch (verifyErr) {
                        setApiError(
                            verifyErr.response?.data?.message ||
                            'Payment verification failed. Please contact customer support.'
                        );
                    } finally {
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: formData.fullName.trim(),
                    contact: formData.phone.trim(),
                    email: customer?.email || ''
                },
                theme: {
                    color: '#4f46e5'
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (failResponse) {
                console.error('Payment failed', failResponse.error);
                setApiError(
                    failResponse.error?.description ||
                    'Payment failed. Your cart has not been cleared. Please try again.'
                );
                setSubmitting(false);
            });

            rzp.open();
        } catch (err) {
            console.error('Order creation error:', err);
            setApiError(
                err.response?.data?.message ||
                'Unable to create order. Please review your cart and try again.'
            );
            setSubmitting(false);
        }
    };

    if (pageLoading || cartLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-sm font-medium text-slate-500">Preparing checkout...</p>
                </div>
            </div>
        );
    }

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900">
                <Navbar customer={customer} />
                <main className="mx-auto max-w-3xl px-4 py-16 text-center">
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                            🛒
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            You cannot proceed to checkout without any items in your cart.
                        </p>
                        <Link
                            to="/products"
                            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                        >
                            Explore Products
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Navbar customer={customer} />

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <Link to="/cart" className="hover:text-indigo-600">Cart</Link>
                    <span>/</span>
                    <span className="font-semibold text-slate-900">Checkout</span>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                    Checkout
                </h1>

                {apiError && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 flex items-start gap-3">
                        <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{apiError}</span>
                    </div>
                )}

                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
                    {/* Shipping Address Form */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <h2 className="text-xl font-bold text-slate-900">Shipping Details</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Please provide the delivery address for this order.
                        </p>

                        <form onSubmit={handlePlaceOrder} className="mt-6 space-y-5">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. Aarav Sharma"
                                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                        errors.fullName
                                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                            : 'border-slate-300 focus:border-indigo-600'
                                    }`}
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. 9876543210"
                                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                        errors.phone
                                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                            : 'border-slate-300 focus:border-indigo-600'
                                    }`}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="addressLine1" className="block text-sm font-semibold text-slate-700">
                                    Address Line <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="addressLine1"
                                    name="addressLine1"
                                    type="text"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="Flat, House no., Building, Street"
                                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                        errors.addressLine1
                                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                            : 'border-slate-300 focus:border-indigo-600'
                                    }`}
                                />
                                {errors.addressLine1 && (
                                    <p className="mt-1 text-xs text-red-600">{errors.addressLine1}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-semibold text-slate-700">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="e.g. Bengaluru"
                                        className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                            errors.city
                                                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                                : 'border-slate-300 focus:border-indigo-600'
                                        }`}
                                    />
                                    {errors.city && (
                                        <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-semibold text-slate-700">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="e.g. Karnataka"
                                        className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                            errors.state
                                                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                                : 'border-slate-300 focus:border-indigo-600'
                                        }`}
                                    />
                                    {errors.state && (
                                        <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="pincode" className="block text-sm font-semibold text-slate-700">
                                    Pincode <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="pincode"
                                    name="pincode"
                                    type="text"
                                    maxLength="6"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="6 digits (e.g. 560001)"
                                    className={`mt-1.5 w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none ${
                                        errors.pincode
                                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                                            : 'border-slate-300 focus:border-indigo-600'
                                    }`}
                                />
                                {errors.pincode && (
                                    <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Order Summary & Payment Button */}
                    <aside className="h-fit space-y-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>

                            <div className="mt-4 divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                                {cartItems.map((item) => (
                                    <div key={item.product?._id || item._id} className="py-3 flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            {item.product?.image && (
                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    className="h-10 w-10 rounded-lg object-cover border border-slate-100"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold text-slate-800 line-clamp-1">
                                                    {item.product?.name}
                                                </p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-slate-900">
                                            {formatPrice((item.product?.price || 0) * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 border-t border-slate-200 pt-4 space-y-2 text-sm">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Total Units</span>
                                    <span className="font-semibold text-slate-900">{totalUnits}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Shipping</span>
                                    <span className="font-semibold text-emerald-600">Free</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900">
                                    <span>Total</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handlePlaceOrder}
                                disabled={submitting}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
                            >
                                {submitting ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        <span>Processing Order...</span>
                                    </>
                                ) : (
                                    <span>Place Order</span>
                                )}
                            </button>

                            <p className="mt-3 text-center text-xs text-slate-400">
                                🔒 Secured by Razorpay Test Payments
                            </p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}

export default Checkout;
