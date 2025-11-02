"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const controller = new controllers_1.CenterController();
// Public routes
router.get('/', controller.getAll);
router.get('/available', controller.getAvailableCenters);
router.get('/area', controller.getCentersInArea);
router.get('/:id', controller.getById);
// Protected routes
router.use(auth_1.requireAuth);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.put('/:id/capacity', controller.updateCapacity);
router.put('/:id/supplies', controller.updateSupplies);
exports.default = router;
