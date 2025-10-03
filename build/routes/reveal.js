"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const journeyController_1 = require("../controllers/journeyController");
const router = express_1.default.Router();
/**
 * Public reveal endpoint for paid journeys
 * Uses secure shareable token for access control
 */
router.get('/:shareableToken', journeyController_1.revealJourneyByToken);
exports.default = router;
