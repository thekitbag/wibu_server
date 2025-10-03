"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const journeyController_1 = require("../controllers/journeyController");
const stopController_1 = require("../controllers/stopController");
const paymentController_1 = require("../controllers/paymentController");
const router = express_1.default.Router();
router.post('/', journeyController_1.createJourney);
router.get('/:id', journeyController_1.getJourneyById);
router.post('/:journeyId/stops', stopController_1.createStop);
router.post('/:journeyId/create-checkout-session', paymentController_1.createCheckoutSession);
exports.default = router;
