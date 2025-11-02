import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { Guest, IGuest } from '../models/Guest';
import { RescueCenter } from '../models/RescueCenter';

export class GuestController extends BaseController<IGuest> {
  constructor() {
    super(Guest);
  }

  // Create guest with center capacity check
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { centerId, ...guestData } = req.body;

      // Check center capacity
      const center = await RescueCenter.findById(centerId);
      if (!center) {
        res.status(404).json({ success: false, error: 'Rescue center not found' });
        return;
      }

      if (center.availableCapacity <= 0) {
        res.status(400).json({ success: false, error: 'Center is at full capacity' });
        return;
      }

      // Create guest
      const guest = new Guest({ ...guestData, centerId });
      await guest.save();

      // Update center capacity
      center.currentGuests += 1;
      center.availableCapacity = center.totalCapacity - center.currentGuests;
      if (center.availableCapacity <= 0) {
        center.status = 'full';
      }
      await center.save();

      res.status(201).json({ success: true, data: guest });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Get guests by center
  getByCenter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { centerId } = req.params;
      const guests = await Guest.find({ centerId });
      res.json({ success: true, data: guests });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Transfer guest to another center
  transferGuest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { guestId } = req.params;
      const { newCenterId } = req.body;

      const guest = await Guest.findById(guestId);
      if (!guest) {
        res.status(404).json({ success: false, error: 'Guest not found' });
        return;
      }

      const oldCenter = await RescueCenter.findById(guest.centerId);
      const newCenter = await RescueCenter.findById(newCenterId);

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
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Search guests
  searchGuests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { query } = req.query;
      const searchRegex = new RegExp(query as string, 'i');

      const guests = await Guest.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { mobilePhone: searchRegex }
        ]
      });

      res.json({ success: true, data: guests });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}