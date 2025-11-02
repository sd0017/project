"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const centers_1 = __importDefault(require("./centers"));
const guests_1 = __importDefault(require("./guests"));
const notifications_1 = __importDefault(require("./notifications"));
const stats_1 = __importDefault(require("./stats"));
const audit_1 = __importDefault(require("./audit"));
const router = (0, express_1.Router)();
// Register routes
router.use('/auth', auth_1.default);
router.use('/centers', centers_1.default);
router.use('/guests', guests_1.default);
router.use('/notifications', notifications_1.default);
router.use('/stats', stats_1.default);
router.use('/audit', audit_1.default);
exports.default = router;
