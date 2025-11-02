"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CenterController = void 0;
const BaseController_1 = require("./BaseController");
const RescueCenter_1 = require("../models/RescueCenter");
class CenterController extends BaseController_1.BaseController {
    constructor() {
        super(RescueCenter_1.RescueCenter);
        // Get centers with available capacity
        this.getAvailableCenters = async (req, res) => {
            try {
                const centers = await RescueCenter_1.RescueCenter.find({
                    availableCapacity: { $gt: 0 },
                    status: 'active'
                });
                res.json({ success: true, data: centers });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Update center capacity
        this.updateCapacity = async (req, res) => {
            try {
                const { id } = req.params;
                const { currentGuests } = req.body;
                const center = await RescueCenter_1.RescueCenter.findById(id);
                if (!center) {
                    res.status(404).json({ success: false, error: 'Center not found' });
                    return;
                }
                center.currentGuests = currentGuests;
                center.availableCapacity = center.totalCapacity - currentGuests;
                // Update status if full
                if (center.availableCapacity <= 0) {
                    center.status = 'full';
                }
                else if (center.status === 'full') {
                    center.status = 'active';
                }
                await center.save();
                res.json({ success: true, data: center });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Update supplies
        this.updateSupplies = async (req, res) => {
            try {
                const { id } = req.params;
                const { waterLevel, foodLevel, supplies } = req.body;
                const center = await RescueCenter_1.RescueCenter.findById(id);
                if (!center) {
                    res.status(404).json({ success: false, error: 'Center not found' });
                    return;
                }
                if (waterLevel !== undefined)
                    center.waterLevel = waterLevel;
                if (foodLevel !== undefined)
                    center.foodLevel = foodLevel;
                if (supplies)
                    center.supplies = { ...center.supplies, ...supplies };
                center.lastUpdated = new Date();
                await center.save();
                res.json({ success: true, data: center });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Get centers in an area
        this.getCentersInArea = async (req, res) => {
            try {
                const { lat, lng, radius } = req.query;
                const coordinates = [parseFloat(lng), parseFloat(lat)];
                const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters
                const centers = await RescueCenter_1.RescueCenter.find({
                    location: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: coordinates
                            },
                            $maxDistance: radiusInMeters
                        }
                    }
                });
                res.json({ success: true, data: centers });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid parameters' });
            }
        };
    }
}
exports.CenterController = CenterController;
