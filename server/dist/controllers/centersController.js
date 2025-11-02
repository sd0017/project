"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCenters = getAllCenters;
exports.getCenterById = getCenterById;
exports.createCenter = createCenter;
exports.updateCenter = updateCenter;
exports.deleteCenter = deleteCenter;
const RescueCenter_1 = require("../models/RescueCenter");
async function getAllCenters(_req, res) {
    const centers = await RescueCenter_1.RescueCenter.find().sort({ createdAt: -1 });
    res.json(centers);
}
async function getCenterById(req, res) {
    const { id } = req.params;
    const center = await RescueCenter_1.RescueCenter.findOne({ id });
    if (!center)
        return res.status(404).json({ error: 'Center not found' });
    res.json(center);
}
async function createCenter(req, res) {
    const data = req.body;
    const newCenter = {
        ...data,
        id: data.id || `RC${Date.now()}`,
        availableCapacity: data.totalCapacity,
        currentGuests: data.currentGuests || 0,
        lastUpdated: new Date()
    };
    const created = await RescueCenter_1.RescueCenter.create(newCenter);
    res.status(201).json(created);
}
async function updateCenter(req, res) {
    const { id } = req.params;
    const updates = req.body;
    const updated = await RescueCenter_1.RescueCenter.findOneAndUpdate({ id }, updates, { new: true });
    if (!updated)
        return res.status(404).json({ error: 'Center not found' });
    res.json(updated);
}
async function deleteCenter(req, res) {
    const { id } = req.params;
    await RescueCenter_1.RescueCenter.findOneAndDelete({ id });
    res.status(204).send();
}
