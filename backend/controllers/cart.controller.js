import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";

const cartProductSelect = "name price image stock";

const getPopulatedCart = async (userId) => {
    const user = await Customer.findById(userId).populate({
        path: "cart.product",
        select: cartProductSelect
    });

    return user.cart;
};

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const user = await Customer.findById(req.user._id);
        const cartItem = user.cart.find((item) => item.product.toString() === productId);
        const nextQuantity = cartItem ? cartItem.quantity + 1 : 1;

        if (nextQuantity > product.stock) {
            return res.status(400).json({ success: false, message: "Quantity exceeds available stock" });
        }

        if (cartItem) {
            cartItem.quantity = nextQuantity;
        } else {
            user.cart.push({ product: productId, quantity: 1 });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: await getPopulatedCart(user._id)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getCart = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            cart: await getPopulatedCart(req.user._id)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateCartQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const numericQuantity = Number(quantity);
        if (!Number.isFinite(numericQuantity) || numericQuantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
        }

        if (numericQuantity > product.stock) {
            return res.status(400).json({ success: false, message: "Quantity exceeds available stock" });
        }

        const user = await Customer.findById(req.user._id);
        const cartItem = user.cart.find((item) => item.product.toString() === productId);

        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Product not in cart" });
        }

        cartItem.quantity = numericQuantity;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: await getPopulatedCart(user._id)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const user = await Customer.findById(req.user._id);
        const itemIndex = user.cart.findIndex((item) => item.product.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: "Product not in cart" });
        }

        user.cart.splice(itemIndex, 1);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: await getPopulatedCart(user._id)
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
