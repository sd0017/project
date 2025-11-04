import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CenterModel, { ICenterDocument } from '../models/Center';
import GuestModel from '../models/Guest';
import { getIo } from '../socket';

// Types for responses
interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Helper to check roles (assumes req.user set by auth middleware)
function hasRole(req: Request, roles: string[]) {
  const user = (req as any).user;
  if (!user) return false;
  return roles.includes(user.role);
}

export const getAllCenters = async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: new RegExp(search, 'i') };

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await CenterModel.countDocuments(filter);
    const centers = await CenterModel.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const result: PaginatedResult<any> = {
      items: centers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };

    return res.json({ centers: result.items, pagination: result.pagination });
  } catch (err) {
    console.error('getAllCenters error', err);
    return res.status(500).json({ error: 'Unable to fetch centers' });
  }
};

export const getCenterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const includeGuests = req.query.includeGuests === 'true' || req.query.includeGuests === true;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid center id' });

    const center = await CenterModel.findById(id).lean();
    if (!center) return res.status(404).json({ error: 'Center not found' });

    // compute current occupancy from guests to ensure consistency
    const currentOccupancy = await GuestModel.countDocuments({ centerId: center._id, status: 'active' });

    const response: any = { ...center, currentOccupancy };

    if (includeGuests) {
      const guests = await GuestModel.find({ centerId: center._id }).lean();
      response.guests = guests;
    }

    return res.json(response);
  } catch (err) {
    console.error('getCenterById error', err);
    return res.status(500).json({ error: 'Unable to fetch center' });
  }
};

export const createCenter = async (req: Request, res: Response) => {
  try {
    // Authorization: only government or admin
    if (!hasRole(req, ['government', 'admin'])) return res.status(403).json({ error: 'Forbidden' });

    const { name, location, capacity, resources = [], contactInfo, managedBy } = req.body;

    // Validation
    if (!name || !location || !capacity) {
      return res.status(400).json({ error: 'name, location and capacity are required' });
    }
    if (!location.address || !location.coordinates || !Array.isArray(location.coordinates.coordinates)) {
      return res.status(400).json({ error: 'location must include address and coordinates [lng, lat]' });
    }

    const center = new CenterModel({ name, location, capacity, resources, contactInfo, managedBy });
    await center.save();

    // Emit socket event
    const io = getIo();
    io?.emit('center:created', { center });

    return res.status(201).json({ center });
  } catch (err) {
    console.error('createCenter error', err);
    return res.status(500).json({ error: 'Unable to create center' });
  }
};

export const updateCenter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid center id' });

    // Authorization: government, admin, or the rescue-center manager (managedBy)
    const user = (req as any).user;
    const center = await CenterModel.findById(id);
    if (!center) return res.status(404).json({ error: 'Center not found' });

    const allowed = hasRole(req, ['government', 'admin']) || (user && center.managedBy && user._id && center.managedBy.toString() === user._id.toString());
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const updates = req.body as Partial<ICenterDocument>;

    // If capacity is being reduced below current occupancy, prevent it or adjust currentOccupancy
    if (typeof updates.capacity === 'number' && updates.capacity < center.currentOccupancy) {
      return res.status(400).json({ error: 'New capacity cannot be less than current occupancy' });
    }

    // Apply partial updates
    Object.keys(updates).forEach((k) => {
      // @ts-ignore
      center[k] = updates[k];
    });

    // If capacity changed, ensure status/full updated
    if (typeof updates.capacity === 'number') {
      if (center.currentOccupancy >= center.capacity) center.status = 'full';
      else center.status = center.status === 'full' ? 'active' : center.status;
    }

    await center.save();

    // Emit socket event
    const io = getIo();
    io?.emit('center:updated', { center });

    return res.json({ center });
  } catch (err) {
    console.error('updateCenter error', err);
    return res.status(500).json({ error: 'Unable to update center' });
  }
};

export const deleteCenter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid center id' });

    const center = await CenterModel.findById(id);
    if (!center) return res.status(404).json({ error: 'Center not found' });

    // Authorization: government or admin only
    if (!hasRole(req, ['government', 'admin'])) return res.status(403).json({ error: 'Forbidden' });

    const activeGuests = await GuestModel.countDocuments({ centerId: center._id, status: 'active' });
    if (activeGuests > 0) return res.status(400).json({ error: 'Center has active guests and cannot be deleted' });

    // Business decision: perform hard delete
    await center.remove();

    const io = getIo();
    io?.emit('center:deleted', { centerId: id });

    return res.json({ success: true });
  } catch (err) {
    console.error('deleteCenter error', err);
    return res.status(500).json({ error: 'Unable to delete center' });
  }
};

export const getCenterStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid center id' });

    const center = await CenterModel.findById(id).lean();
    if (!center) return res.status(404).json({ error: 'Center not found' });

    const totalGuests = await GuestModel.countDocuments({ centerId: center._id });
    const activeGuests = await GuestModel.countDocuments({ centerId: center._id, status: 'active' });
    const occupancyRate = center.capacity > 0 ? Number(((activeGuests / center.capacity) * 100).toFixed(2)) : 0;

    // daily admissions for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const dailyAdmissionsAgg = await GuestModel.aggregate([
      { $match: { centerId: center._id, admittedAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$admittedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyAdmissions = dailyAdmissionsAgg.map((d: any) => ({ date: d._id, count: d.count }));

    return res.json({
      totalGuests,
      capacity: center.capacity,
      occupancyRate,
      resources: center.resources || [],
      dailyAdmissions,
    });
  } catch (err) {
    console.error('getCenterStats error', err);
    return res.status(500).json({ error: 'Unable to compute stats' });
  }
};

export default {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
  getCenterStats,
};
