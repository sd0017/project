import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RescueCenter, IRescueCenter } from '../models/RescueCenter';

export class CenterController extends BaseController<IRescueCenter> {
  constructor() {
    super(RescueCenter);
  }

  // Get centers with available capacity
  getAvailableCenters = async (req: Request, res: Response): Promise<void> => {
    try {
      const centers = await RescueCenter.find({
        availableCapacity: { $gt: 0 },
        status: 'active'
      });
      res.json({ success: true, data: centers });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Update center capacity
  updateCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { currentGuests } = req.body;

      const center = await RescueCenter.findById(id);
      if (!center) {
        res.status(404).json({ success: false, error: 'Center not found' });
        return;
      }

      center.currentGuests = currentGuests;
      center.availableCapacity = center.totalCapacity - currentGuests;
      
      // Update status if full
      if (center.availableCapacity <= 0) {
        center.status = 'full';
      } else if (center.status === 'full') {
        center.status = 'active';
      }

      await center.save();
      res.json({ success: true, data: center });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Update supplies
  updateSupplies = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { waterLevel, foodLevel, supplies } = req.body;

      const center = await RescueCenter.findById(id);
      if (!center) {
        res.status(404).json({ success: false, error: 'Center not found' });
        return;
      }

      if (waterLevel !== undefined) center.waterLevel = waterLevel;
      if (foodLevel !== undefined) center.foodLevel = foodLevel;
      if (supplies) center.supplies = { ...center.supplies, ...supplies };

      center.lastUpdated = new Date();
      await center.save();
      
      res.json({ success: true, data: center });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Get centers in an area
  getCentersInArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lng, radius } = req.query;
      const coordinates = [parseFloat(lng as string), parseFloat(lat as string)];
      const radiusInMeters = parseFloat(radius as string) * 1000; // Convert km to meters

      const centers = await RescueCenter.find({
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
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid parameters' });
    }
  };
}