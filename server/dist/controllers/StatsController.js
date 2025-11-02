"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const RescueCenter_1 = require("../models/RescueCenter");
const Guest_1 = require("../models/Guest");
class StatsController {
    constructor() {
        // Get disaster statistics
        this.getStats = async (req, res) => {
            try {
                // Get total centers
                const [totalCenters, activeCenters, fullCenters, totalCapacity, totalGuests, centersWithLowSupplies] = await Promise.all([
                    RescueCenter_1.RescueCenter.countDocuments(),
                    RescueCenter_1.RescueCenter.countDocuments({ status: 'active' }),
                    RescueCenter_1.RescueCenter.countDocuments({ status: 'full' }),
                    RescueCenter_1.RescueCenter.aggregate([
                        { $group: { _id: null, total: { $sum: '$totalCapacity' } } }
                    ]),
                    Guest_1.Guest.countDocuments(),
                    RescueCenter_1.RescueCenter.countDocuments({
                        $or: [
                            { waterLevel: { $lt: 20 } },
                            { foodLevel: { $lt: 20 } }
                        ]
                    })
                ]);
                const stats = {
                    centers: {
                        total: totalCenters,
                        active: activeCenters,
                        full: fullCenters,
                        needingSupplies: centersWithLowSupplies
                    },
                    capacity: {
                        total: totalCapacity[0]?.total || 0,
                        occupied: totalGuests,
                        available: (totalCapacity[0]?.total || 0) - totalGuests
                    },
                    occupancyRate: totalCapacity[0]?.total
                        ? Math.round((totalGuests / totalCapacity[0].total) * 100)
                        : 0
                };
                res.json({ success: true, data: stats });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Get center-specific stats
        this.getCenterStats = async (req, res) => {
            try {
                const { id } = req.params;
                const [center, guestCount] = await Promise.all([
                    RescueCenter_1.RescueCenter.findById(id),
                    Guest_1.Guest.countDocuments({ centerId: id })
                ]);
                if (!center) {
                    res.status(404).json({ success: false, error: 'Center not found' });
                    return;
                }
                const stats = {
                    name: center.name,
                    capacity: {
                        total: center.totalCapacity,
                        current: guestCount,
                        available: center.totalCapacity - guestCount
                    },
                    supplies: {
                        water: center.waterLevel,
                        food: center.foodLevel,
                        ...center.supplies
                    },
                    status: center.status,
                    occupancyRate: Math.round((guestCount / center.totalCapacity) * 100),
                    lastUpdated: center.lastUpdated
                };
                res.json({ success: true, data: stats });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Get supply levels across all centers
        this.getSupplyStats = async (req, res) => {
            try {
                const centers = await RescueCenter_1.RescueCenter.find({}, {
                    name: 1,
                    waterLevel: 1,
                    foodLevel: 1,
                    supplies: 1,
                    status: 1
                });
                const stats = {
                    centersNeedingWater: centers.filter(c => c.waterLevel < 20).length,
                    centersNeedingFood: centers.filter(c => c.foodLevel < 20).length,
                    averageWaterLevel: Math.round(centers.reduce((sum, c) => sum + c.waterLevel, 0) / centers.length),
                    averageFoodLevel: Math.round(centers.reduce((sum, c) => sum + c.foodLevel, 0) / centers.length),
                    criticalCenters: centers.filter(c => c.waterLevel < 20 ||
                        c.foodLevel < 20 ||
                        c.status === 'full').map(c => ({
                        id: c._id,
                        name: c.name,
                        status: c.status,
                        waterLevel: c.waterLevel,
                        foodLevel: c.foodLevel
                    }))
                };
                res.json({ success: true, data: stats });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
    }
}
exports.StatsController = StatsController;
