"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public auth routes
router.post('/register', AuthController_1.register);
router.post('/login', AuthController_1.login);
router.post('/government-login', AuthController_1.governmentLogin);
router.post('/rescue-login', AuthController_1.rescueCenterLogin);
// Protected routes
router.use(auth_1.requireAuth);
router.get('/me', AuthController_1.me);
exports.default = router;
