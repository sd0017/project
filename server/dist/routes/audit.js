"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new controllers_1.AuditController();
// All audit routes require authentication
router.use(auth_1.requireAuth);
router.get('/resource/:resourceType/:resourceId', controller.getResourceLogs);
router.get('/user/:userId', controller.getUserLogs);
router.get('/system', controller.getSystemLogs);
exports.default = router;
