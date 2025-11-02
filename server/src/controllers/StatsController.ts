import { Request, Response } from 'express';
import { RescueCenter } from '../models/RescueCenter';
import { Guest } from '../models/Guest';

export class StatsController {
  // Get disaster statistics
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get total centers
      const [
        totalCenters,
        activeCenters,
        fullCenters,
        totalCapacity,
        totalGuests,
        centersWithLowSupplies
      ] = await Promise.all([
        RescueCenter.countDocuments(),
        RescueCenter.countDocuments({ status: 'active' }),
        RescueCenter.countDocuments({ status: 'full' }),
        RescueCenter.aggregate([
          { $group: { _id: null, total: { $sum: '$totalCapacity' } } }
        ]),
        Guest.countDocuments(),
        RescueCenter.countDocuments({
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
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Get center-specific stats
  getCenterStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const [center, guestCount] = await Promise.all([
        RescueCenter.findById(id),
        Guest.countDocuments({ centerId: id })
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
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Get supply levels across all centers
  getSupplyStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const centers = await RescueCenter.find({}, {
        name: 1,
        waterLevel: 1,
        foodLevel: 1,
        supplies: 1,
        status: 1
      });

      const stats = {
        centersNeedingWater: centers.filter(c => c.waterLevel < 20).length,
        centersNeedingFood: centers.filter(c => c.foodLevel < 20).length,
        averageWaterLevel: Math.round(
          centers.reduce((sum, c) => sum + c.waterLevel, 0) / centers.length
        ),
        averageFoodLevel: Math.round(
          centers.reduce((sum, c) => sum + c.foodLevel, 0) / centers.length
        ),
        criticalCenters: centers.filter(c => 
          c.waterLevel < 20 || 
          c.foodLevel < 20 ||
          c.status === 'full'
        ).map(c => ({
          id: c._id,
          name: c.name,
          status: c.status,
          waterLevel: c.waterLevel,
          foodLevel: c.foodLevel
        }))
      };

      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}