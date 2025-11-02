import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { RescueCenter } from '../models/RescueCenter';

export async function getAllGuests(_req: Request, res: Response) {
  const guests = await Guest.find().sort({ createdAt: -1 });
  res.json(guests);
}

export async function getGuestById(req: Request, res: Response) {
  const { id } = req.params;
  const guest = await Guest.findOne({ id });
  if (!guest) return res.status(404).json({ error: 'Guest not found' });
  res.json(guest);
}

export async function createGuest(req: Request, res: Response) {
  const data = req.body;
  const newGuest = {
    ...data,
    id: data.id || `GUEST${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
  };

  const created = await Guest.create(newGuest as any);

  // Update center counts if possible
  try {
    const center = await RescueCenter.findOne({ id: data.centerId });
    if (center) {
      center.currentGuests = (center.currentGuests || 0) + 1;
      center.availableCapacity = center.totalCapacity - center.currentGuests;
      await center.save();
    }
  } catch (err) {
    console.warn('Failed to update center counts', err);
  }

  res.status(201).json(created);
}

export async function updateGuest(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const updated = await Guest.findOneAndUpdate({ id }, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Guest not found' });
  res.json(updated);
}

export async function deleteGuest(req: Request, res: Response) {
  const { id } = req.params;
  const guest = await Guest.findOneAndDelete({ id });
  if (guest) {
    try {
      const centerId = (guest as any)?.centerId;
      if (centerId) {
        const center = await RescueCenter.findOne({ id: centerId });
        if (center) {
          center.currentGuests = Math.max(0, (center.currentGuests || 1) - 1);
          center.availableCapacity = center.totalCapacity - center.currentGuests;
          await center.save();
        }
      }
    } catch (err) {
      console.warn('Failed to update center counts after guest delete', err);
    }
  }

  res.status(204).send();
}
