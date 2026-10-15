import express from "express";
import {
    addToWishlist,
    getWishlist,
    removeFromWishlist
} from "../controllers/wishlist.controller.js";
import isAuthenticated from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/:productId", isAuthenticated, addToWishlist);
router.get("/", isAuthenticated, getWishlist);
router.delete("/:productId", isAuthenticated, removeFromWishlist);

export default router;
