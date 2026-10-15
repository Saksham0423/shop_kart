import express from "express";
import {
    createPaymentOrder,
    getOrderById,
    getOrders,
    updateOrderStatus,
    verifyPayment
} from "../controllers/order.controller.js";
import isAuthenticated from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-payment-order", isAuthenticated, createPaymentOrder);
router.post("/verify-payment", isAuthenticated, verifyPayment);
router.post("/", isAuthenticated, createPaymentOrder);
router.get("/", isAuthenticated, getOrders);
router.get("/:id", isAuthenticated, getOrderById);
router.patch("/:id/status", isAuthenticated, updateOrderStatus);

export default router;
