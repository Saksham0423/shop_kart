import { useState } from 'react';
import { useCart } from '../context/useCart';

function CartItem({ item }) {
    const { removeFromCart, updateQuantity } = useCart();
    const [action, setAction] = useState('');
    const [itemError, setItemError] = useState('');
    const product = item.product;
    const productId = product?._id;
    const quantity = Number(item.quantity || 0);
    const price = Number(product?.price || 0);
    const stock = Number(product?.stock || 0);

    const formatPrice = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

    const changeQuantity = async (nextQuantity) => {
        if (!productId || nextQuantity < 1 || nextQuantity > stock || action) return;

        setAction('quantity');
        setItemError('');
        try {
            await updateQuantity(productId, nextQuantity);
        } catch (err) {
            setItemError(err.response?.data?.message || 'Unable to update quantity.');
        } finally {
            setAction('');
        }
    };

    const removeItem = async () => {
        if (!productId || action) return;

        setAction('remove');
        setItemError('');
        try {
            await removeFromCart(productId);
        } catch (err) {
            setItemError(err.response?.data?.message || 'Unable to remove item.');
            setAction('');
        }
    };

    return (
        <div className="border-b border-slate-200 py-6 last:border-b-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-28 w-28 overflow-hidden rounded-xl bg-slate-100">
                    {product?.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                        />
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">{product?.name || 'Product unavailable'}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{formatPrice(price)}</p>
                    <p className="mt-1 text-xs text-slate-500">{stock} in stock</p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <button
                                type="button"
                                onClick={() => changeQuantity(quantity - 1)}
                                disabled={quantity <= 1 || action === 'quantity'}
                                className="h-10 w-10 text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                                -
                            </button>
                            <span className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 px-4 text-sm font-bold text-slate-900">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => changeQuantity(quantity + 1)}
                                disabled={quantity >= stock || action === 'quantity'}
                                className="h-10 w-10 text-lg font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={removeItem}
                            disabled={action === 'remove'}
                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                        >
                            {action === 'remove' ? 'Removing...' : 'Remove'}
                        </button>
                    </div>

                    {itemError && (
                        <p className="mt-3 text-sm font-semibold text-red-600">{itemError}</p>
                    )}
                </div>

                <div className="text-left sm:text-right">
                    <p className="text-lg font-black text-slate-900">{formatPrice(price * quantity)}</p>
                </div>
            </div>
        </div>
    );
}

export default CartItem;
