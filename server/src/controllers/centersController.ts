import { Request, Response } from 'express';
import { RescueCenter } from '../models/RescueCenter';
import { getIo } from '../socket';

export async function getAllCenters(_req: Request, res: Response) {
  const centers = await RescueCenter.find().sort({ createdAt: -1 });
  res.json(centers);
}

export async function getCenterById(req: Request, res: Response) {
  const { id } = req.params;
  const center = await RescueCenter.findOne({ id });
  if (!center) return res.status(404).json({ error: 'Center not found' });
  res.json(center);
}

export async function createCenter(req: Request, res: Response) {
  const data = req.body;
  const newCenter = {
    ...data,
    id: data.id || `RC${Date.now()}`,
    availableCapacity: data.totalCapacity,
    currentGuests: data.currentGuests || 0,
    lastUpdated: new Date()
  };

  const created = await RescueCenter.create(newCenter as any);
  // Emit center created
  try {
    const io = getIo();
    io?.emit('center:updated', created);
  } catch (e) {
    console.warn('Failed to emit center:updated on create', e);
  }

  res.status(201).json(created);
}

export async function updateCenter(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;
  const updated = await RescueCenter.findOneAndUpdate({ id }, updates, { new: true });
  if (!updated) return res.status(404).json({ error: 'Center not found' });
  // Emit center updated
  try {
    const io = getIo();
    io?.emit('center:updated', updated);
  } catch (e) {
    console.warn('Failed to emit center:updated', e);
  }

  res.json(updated);
}

export async function deleteCenter(req: Request, res: Response) {
  const { id } = req.params;
  await RescueCenter.findOneAndDelete({ id });
  // Emit center deleted
  try {
    const io = getIo();
    io?.emit('center:deleted', { id });
  } catch (e) {
    console.warn('Failed to emit center:deleted', e);
  }

  res.status(204).send();
}
