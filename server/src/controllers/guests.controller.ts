import { Request, Response } from 'express';
import mongoose from 'mongoose';
import GuestModel, { IGuestDocument } from '../models/Guest';
import CenterModel, { ICenterDocument } from '../models/Center';
import { getIo } from '../socket';

// Pagination type
interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function hasRole(req: Request, roles: string[]) {
  const user = (req as any).user;
  if (!user) return false;
  return roles.includes(user.role);
}

export const getAllGuests = async (req: Request, res: Response) => {
  try {
    const { centerId, status, search, page = '1', limit = '20' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

    const filter: any = {};
    if (centerId && mongoose.Types.ObjectId.isValid(centerId)) filter.centerId = new mongoose.Types.ObjectId(centerId);
    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { aadharNumber: regex },
        { 'contactInfo.phone': regex },
        { 'contactInfo.email': regex },
      ];
    }

    const total = await GuestModel.countDocuments(filter);
    const guests = await GuestModel.find(filter)
      .sort({ admittedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const result: PaginatedResult<any> = {
      items: guests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };

    return res.json({ guests: result.items, pagination: result.pagination });
  } catch (err) {
    console.error('getAllGuests error', err);
    return res.status(500).json({ error: 'Unable to fetch guests' });
  }
};

export const getGuestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid guest id' });

    const guest = await GuestModel.findById(id).populate('centerId').lean();
    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    return res.json({ guest });
  } catch (err) {
    console.error('getGuestById error', err);
    return res.status(500).json({ error: 'Unable to fetch guest' });
  }
};

export const createGuest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { firstName, lastName, age, gender, contactInfo, aadharNumber, centerId, medicalNeeds = [], specialRequirements } = req.body;

    if (!firstName || !lastName || !centerId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'firstName, lastName and centerId are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid centerId' });
    }

    const center = await CenterModel.findById(centerId).session(session);
    if (!center) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Center not found' });
    }

    if ((center.currentOccupancy || 0) >= (center.capacity || 0)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Center is full' });
    }

    // create guest
    const guest = new GuestModel({
      firstName,
      lastName,
      age,
      gender,
      contactInfo,
      aadharNumber,
      centerId: center._id,
      medicalNeeds,
      specialRequirements,
    });

    await guest.save({ session });

    // increment occupancy
    center.currentOccupancy = (center.currentOccupancy || 0) + 1;
    if (center.currentOccupancy >= center.capacity) center.status = 'full';
    await center.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIo();
    io?.emit('guest:created', { guest });
    io?.emit('center:updated', { centerId: center._id, currentOccupancy: center.currentOccupancy });

    return res.status(201).json({ guest });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('createGuest error', err);
    return res.status(500).json({ error: 'Unable to create guest' });
  }
};

export const updateGuest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid guest id' });
    }

    const guest = await GuestModel.findById(id).session(session);
    if (!guest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Guest not found' });
    }

    const updates = req.body as Partial<IGuestDocument> & { transferToCenterId?: string };

    // handle status change
    if (updates.status && updates.status !== guest.status) {
      // active -> discharged: decrement occupancy
      if (guest.status === 'active' && updates.status === 'discharged') {
        const center = await CenterModel.findById(guest.centerId).session(session);
        if (center) {
          center.currentOccupancy = Math.max(0, (center.currentOccupancy || 1) - 1);
          if (center.currentOccupancy < center.capacity) center.status = 'active';
          await center.save({ session });
          // emit center update
          const io = getIo();
          io?.emit('center:updated', { centerId: center._id, currentOccupancy: center.currentOccupancy });
        }
      }
    }

    // handle transfer via dedicated field 'transferToCenterId' or centerId in updates
    const transferTo = updates.transferToCenterId || (updates.centerId as any);
    if (transferTo) {
      if (!mongoose.Types.ObjectId.isValid(String(transferTo))) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Invalid transfer target center id' });
      }

      const fromCenter = await CenterModel.findById(guest.centerId).session(session);
      const toCenter = await CenterModel.findById(transferTo).session(session);
      if (!toCenter) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Target center not found' });
      }
      if ((toCenter.currentOccupancy || 0) >= (toCenter.capacity || 0)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ error: 'Target center is full' });
      }

      // perform transfer
      if (fromCenter) {
        fromCenter.currentOccupancy = Math.max(0, (fromCenter.currentOccupancy || 1) - 1);
        if (fromCenter.currentOccupancy < fromCenter.capacity) fromCenter.status = 'active';
        await fromCenter.save({ session });
      }

      toCenter.currentOccupancy = (toCenter.currentOccupancy || 0) + 1;
      if (toCenter.currentOccupancy >= toCenter.capacity) toCenter.status = 'full';
      await toCenter.save({ session });

      guest.centerId = toCenter._id as any;
    }

    // apply other partial updates
    const allowed = ['firstName', 'lastName', 'age', 'gender', 'contactInfo', 'aadharNumber', 'status', 'medicalNeeds', 'specialRequirements'];
    allowed.forEach((k) => {
      // @ts-ignore
      if (updates[k] !== undefined) guest.set(k, updates[k]);
    });

    await guest.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIo();
    io?.emit('guest:updated', { guest });

    return res.json({ guest });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('updateGuest error', err);
    return res.status(500).json({ error: 'Unable to update guest' });
  }
};

export const deleteGuest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid guest id' });
    }

    const guest = await GuestModel.findById(id).session(session);
    if (!guest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Guest not found' });
    }

    const center = await CenterModel.findById(guest.centerId).session(session);
    if (center && guest.status === 'active') {
      center.currentOccupancy = Math.max(0, (center.currentOccupancy || 1) - 1);
      if (center.currentOccupancy < center.capacity) center.status = 'active';
      await center.save({ session });
    }

    await guest.remove({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIo();
    io?.emit('guest:deleted', { guestId: id });
    if (center) io?.emit('center:updated', { centerId: center._id, currentOccupancy: center.currentOccupancy });

    return res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('deleteGuest error', err);
    return res.status(500).json({ error: 'Unable to delete guest' });
  }
};

// Simple highlighting helper
function highlight(text: string, query: string) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'ig');
  return text.replace(re, '<mark>$1</mark>');
}

export const searchGuests = async (req: Request, res: Response) => {
  try {
    const { q, centerId, status, page = '1', limit = '20' } = req.query as any;
    if (!q) return res.status(400).json({ error: 'q (query) is required' });
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

    const regex = new RegExp(q, 'i');
    const filter: any = { $or: [{ firstName: regex }, { lastName: regex }, { aadharNumber: regex }, { 'contactInfo.phone': regex }, { 'contactInfo.email': regex }] };
    if (centerId && mongoose.Types.ObjectId.isValid(centerId)) filter.centerId = new mongoose.Types.ObjectId(centerId);
    if (status) filter.status = status;

    const total = await GuestModel.countDocuments(filter);
    const docs = await GuestModel.find(filter).skip((pageNum - 1) * limitNum).limit(limitNum).lean();

    // add highlighting
    const results = docs.map((d) => {
      const highlighted: any = { ...d };
      if (typeof d.firstName === 'string') highlighted.firstNameHighlighted = highlight(d.firstName, q);
      if (typeof d.lastName === 'string') highlighted.lastNameHighlighted = highlight(d.lastName, q);
      if (typeof d.aadharNumber === 'string') highlighted.aadharNumberHighlighted = highlight(d.aadharNumber, q);
      if (d.contactInfo) {
        if (d.contactInfo.phone) highlighted.contactPhoneHighlighted = highlight(d.contactInfo.phone, q);
        if (d.contactInfo.email) highlighted.contactEmailHighlighted = highlight(d.contactInfo.email, q);
      }
      return highlighted;
    });

    return res.json({ results, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('searchGuests error', err);
    return res.status(500).json({ error: 'Unable to search guests' });
  }
};

export const transferGuest = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { targetCenterId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetCenterId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid ids' });
    }

    const guest = await GuestModel.findById(id).session(session);
    if (!guest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Guest not found' });
    }

    const fromCenter = await CenterModel.findById(guest.centerId).session(session);
    const toCenter = await CenterModel.findById(targetCenterId).session(session);
    if (!toCenter) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Target center not found' });
    }
    if ((toCenter.currentOccupancy || 0) >= (toCenter.capacity || 0)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Target center is full' });
    }

    // update occupancies
    if (fromCenter) {
      fromCenter.currentOccupancy = Math.max(0, (fromCenter.currentOccupancy || 1) - 1);
      if (fromCenter.currentOccupancy < fromCenter.capacity) fromCenter.status = 'active';
      await fromCenter.save({ session });
    }

    toCenter.currentOccupancy = (toCenter.currentOccupancy || 0) + 1;
    if (toCenter.currentOccupancy >= toCenter.capacity) toCenter.status = 'full';
    await toCenter.save({ session });

    guest.centerId = toCenter._id as any;
    await guest.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIo();
    io?.emit('guest:updated', { guest });
    if (fromCenter) io?.emit('center:updated', { centerId: fromCenter._id, currentOccupancy: fromCenter.currentOccupancy });
    io?.emit('center:updated', { centerId: toCenter._id, currentOccupancy: toCenter.currentOccupancy });

    return res.json({ guest });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('transferGuest error', err);
    return res.status(500).json({ error: 'Unable to transfer guest' });
  }
};

export default {
  getAllGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
  searchGuests,
  transferGuest,
};
