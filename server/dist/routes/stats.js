"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new controllers_1.StatsController();
// Public routes
router.get('/disaster', controller.getStats);
// Protected routes
router.use(auth_1.requireAuth);
router.get('/center/:id', controller.getCenterStats);
router.get('/supplies', controller.getSupplyStats);
exports.default = router;
