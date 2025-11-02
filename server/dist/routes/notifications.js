"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new controllers_1.NotificationController();
// All notification routes require authentication
router.use(auth_1.requireAuth);
router.get('/', controller.getUserNotifications);
router.put('/:id/read', controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);
exports.default = router;
