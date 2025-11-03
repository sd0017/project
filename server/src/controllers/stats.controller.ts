import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CenterModel from '../models/Center';
import GuestModel from '../models/Guest';

export const getDisasterStats = async (req: Request, res: Response) => {
  try {
    const totalCenters = await CenterModel.countDocuments({});
    const activeCenters = await CenterModel.countDocuments({ status: 'active' });

    const totalCapacityAgg = await CenterModel.aggregate([{ $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }]);
    const totalCapacity = totalCapacityAgg[0]?.totalCapacity || 0;

    const totalGuests = await GuestModel.countDocuments({});
    const activeGuests = await GuestModel.countDocuments({ status: 'active' });

    const occupancyRate = totalCapacity > 0 ? Number(((activeGuests / totalCapacity) * 100).toFixed(2)) : 0;

    const criticalCenters = await CenterModel.aggregate([
      { $project: { name: 1, capacity: 1, currentOccupancy: 1, occupancyPct: { $cond: [{ $gt: ['$capacity', 0] }, { $multiply: [{ $divide: ['$currentOccupancy', '$capacity'] }, 100] }, 0] } } },
      { $match: { occupancyPct: { $gte: 90 } } },
      { $sort: { occupancyPct: -1 } },
    ]);

    const twentyFourAgo = new Date();
    twentyFourAgo.setHours(twentyFourAgo.getHours() - 24);
    const recentAdmissions = await GuestModel.countDocuments({ admittedAt: { $gte: twentyFourAgo } });

    return res.json({ totalCenters, activeCenters, totalGuests, totalCapacity, occupancyRate, criticalCenters, recentAdmissions });
  } catch (err) {
    console.error('getDisasterStats error', err);
    return res.status(500).json({ error: 'Unable to compute disaster stats' });
  }
};

export const getCenterAnalytics = async (req: Request, res: Response) => {
  try {
    const { centerId, days = '30' } = req.query as any;
    const daysNum = Math.max(1, parseInt(days, 10) || 30);

    const match: any = {};
    if (centerId) {
      if (!mongoose.Types.ObjectId.isValid(centerId)) return res.status(400).json({ error: 'Invalid centerId' });
      match.centerId = new mongoose.Types.ObjectId(centerId);
    }

    const start = new Date();
    start.setDate(start.getDate() - (daysNum - 1));
    start.setHours(0, 0, 0, 0);

    // daily admissions
    const admissions = await GuestModel.aggregate([
      { $match: { ...(match.centerId ? { centerId: match.centerId } : {}), admittedAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$admittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // daily discharges (use updatedAt when status == discharged)
    const discharges = await GuestModel.aggregate([
      { $match: { ...(match.centerId ? { centerId: match.centerId } : {}), status: 'discharged', updatedAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ admissions, discharges });
  } catch (err) {
    console.error('getCenterAnalytics error', err);
    return res.status(500).json({ error: 'Unable to compute center analytics' });
  }
};

export const getResourceUtilization = async (req: Request, res: Response) => {
  try {
    const { threshold = '10' } = req.query as any;
    const threshNum = Math.max(0, parseInt(threshold, 10) || 10);

    const agg = await CenterModel.aggregate([
      { $unwind: { path: '$resources', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$resources.name', totalQuantity: { $sum: '$resources.quantity' } } },
      { $project: { name: '$_id', totalQuantity: 1, _id: 0 } },
      { $sort: { totalQuantity: 1 } },
    ]);

    const shortages = agg.filter((r: any) => r.totalQuantity <= threshNum);
    return res.json({ resources: agg, shortages });
  } catch (err) {
    console.error('getResourceUtilization error', err);
    return res.status(500).json({ error: 'Unable to compute resource utilization' });
  }
};

export default {
  getDisasterStats,
  getCenterAnalytics,
  getResourceUtilization,
};
