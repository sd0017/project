"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuestController = void 0;
const BaseController_1 = require("./BaseController");
const Guest_1 = require("../models/Guest");
const RescueCenter_1 = require("../models/RescueCenter");
class GuestController extends BaseController_1.BaseController {
    constructor() {
        super(Guest_1.Guest);
        // Create guest with center capacity check
        this.create = async (req, res) => {
            try {
                const { centerId, ...guestData } = req.body;
                // Check center capacity
                const center = await RescueCenter_1.RescueCenter.findById(centerId);
                if (!center) {
                    res.status(404).json({ success: false, error: 'Rescue center not found' });
                    return;
                }
                if (center.availableCapacity <= 0) {
                    res.status(400).json({ success: false, error: 'Center is at full capacity' });
                    return;
                }
                // Create guest
                const guest = new Guest_1.Guest({ ...guestData, centerId });
                await guest.save();
                // Update center capacity
                center.currentGuests += 1;
                center.availableCapacity = center.totalCapacity - center.currentGuests;
                if (center.availableCapacity <= 0) {
                    center.status = 'full';
                }
                await center.save();
                res.status(201).json({ success: true, data: guest });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Get guests by center
        this.getByCenter = async (req, res) => {
            try {
                const { centerId } = req.params;
                const guests = await Guest_1.Guest.find({ centerId });
                res.json({ success: true, data: guests });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Transfer guest to another center
        this.transferGuest = async (req, res) => {
            try {
                const { guestId } = req.params;
                const { newCenterId } = req.body;
                const guest = await Guest_1.Guest.findById(guestId);
                if (!guest) {
                    res.status(404).json({ success: false, error: 'Guest not found' });
                    return;
                }
                const oldCenter = await RescueCenter_1.RescueCenter.findById(guest.centerId);
                const newCenter = await RescueCenter_1.RescueCenter.findById(newCenterId);
                if (!oldCenter || !newCenter) {
                    res.status(404).json({ success: false, error: 'Center not found' });
                    return;
                }
                if (newCenter.availableCapacity <= 0) {
                    res.status(400).json({ success: false, error: 'New center is at full capacity' });
                    return;
                }
                // Update guest's center
                const oldCenterId = guest.centerId;
                guest.centerId = newCenterId;
                await guest.save();
                // Update both centers' capacities
                oldCenter.currentGuests -= 1;
                oldCenter.availableCapacity = oldCenter.totalCapacity - oldCenter.currentGuests;
                if (oldCenter.status === 'full') {
                    oldCenter.status = 'active';
                }
                await oldCenter.save();
                newCenter.currentGuests += 1;
                newCenter.availableCapacity = newCenter.totalCapacity - newCenter.currentGuests;
                if (newCenter.availableCapacity <= 0) {
                    newCenter.status = 'full';
                }
                await newCenter.save();
                res.json({ success: true, data: guest });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Search guests
        this.searchGuests = async (req, res) => {
            try {
                const { query } = req.query;
                const searchRegex = new RegExp(query, 'i');
                const guests = await Guest_1.Guest.find({
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { mobilePhone: searchRegex }
                    ]
                });
                res.json({ success: true, data: guests });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
    }
}
exports.GuestController = GuestController;
