"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkoutController_1 = require("../controllers/checkoutController");
const router = express_1.default.Router();
/**
 * Checkout session status endpoint
 * Allows frontend to poll for payment completion status
 */
router.get('/:sessionId', checkoutController_1.checkCheckoutSessionStatus);
exports.default = router;
