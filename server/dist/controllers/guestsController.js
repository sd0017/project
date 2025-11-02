"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGuests = getAllGuests;
exports.getGuestById = getGuestById;
exports.createGuest = createGuest;
exports.updateGuest = updateGuest;
exports.deleteGuest = deleteGuest;
const Guest_1 = require("../models/Guest");
const RescueCenter_1 = require("../models/RescueCenter");
async function getAllGuests(_req, res) {
    const guests = await Guest_1.Guest.find().sort({ createdAt: -1 });
    res.json(guests);
}
async function getGuestById(req, res) {
    const { id } = req.params;
    const guest = await Guest_1.Guest.findOne({ id });
    if (!guest)
        return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
}
async function createGuest(req, res) {
    const data = req.body;
    const newGuest = {
        ...data,
        id: data.id || `GUEST${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    };
    const created = await Guest_1.Guest.create(newGuest);
    // Update center counts if possible
    try {
        const center = await RescueCenter_1.RescueCenter.findOne({ id: data.centerId });
        if (center) {
            center.currentGuests = (center.currentGuests || 0) + 1;
            center.availableCapacity = center.totalCapacity - center.currentGuests;
            await center.save();
        }
    }
    catch (err) {
        console.warn('Failed to update center counts', err);
    }
    res.status(201).json(created);
}
async function updateGuest(req, res) {
    const { id } = req.params;
    const updates = req.body;
    const updated = await Guest_1.Guest.findOneAndUpdate({ id }, updates, { new: true });
    if (!updated)
        return res.status(404).json({ error: 'Guest not found' });
    res.json(updated);
}
async function deleteGuest(req, res) {
    const { id } = req.params;
    const guest = await Guest_1.Guest.findOneAndDelete({ id });
    if (guest) {
        try {
            const centerId = guest?.centerId;
            if (centerId) {
                const center = await RescueCenter_1.RescueCenter.findOne({ id: centerId });
                if (center) {
                    center.currentGuests = Math.max(0, (center.currentGuests || 1) - 1);
                    center.availableCapacity = center.totalCapacity - center.currentGuests;
                    await center.save();
                }
            }
        }
        catch (err) {
            console.warn('Failed to update center counts after guest delete', err);
        }
    }
    res.status(204).send();
}
