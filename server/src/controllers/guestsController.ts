import { Request, Response } from 'express';
import { Guest } from '../models/Guest';
import { RescueCenter } from '../models/RescueCenter';
import { getIo } from '../socket';

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
      // Emit center update via Socket.IO
      try {
        const io = getIo();
        io?.emit('center:updated', { id: center.id, availableCapacity: center.availableCapacity, currentGuests: center.currentGuests });
      } catch (e) {
        console.warn('Failed to emit center:updated event', e);
      }
    }
  } catch (err) {
    console.warn('Failed to update center counts', err);
  }

  // Emit guest created event
  try {
    const io = getIo();
    io?.emit('guest:created', created);
  } catch (e) {
    console.warn('Failed to emit guest:created event', e);
  }

  res.status(201).json(created);
}

export async function updateGuest(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const updated = await Guest.findOneAndUpdate({ id }, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Guest not found' });
  // Emit guest updated
  try {
    const io = getIo();
    io?.emit('guest:updated', updated);
  } catch (e) {
    console.warn('Failed to emit guest:updated', e);
  }

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
          // Emit center updated after deletion
          try {
            const io = getIo();
            io?.emit('center:updated', { id: center.id, availableCapacity: center.availableCapacity, currentGuests: center.currentGuests });
          } catch (e) {
            console.warn('Failed to emit center:updated after guest delete', e);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to update center counts after guest delete', err);
    }
  }

  // Emit guest deleted (send id)
  try {
    const io = getIo();
    io?.emit('guest:deleted', { id });
  } catch (e) {
    console.warn('Failed to emit guest:deleted', e);
  }

  res.status(204).send();
}
