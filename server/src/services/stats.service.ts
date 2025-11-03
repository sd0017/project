import { Types } from 'mongoose';
import Center from '../models/Center';
import Guest from '../models/Guest';
import { ApiError } from '../utils/ApiError';

export interface ISystemStats {
  totalCenters: number;
  totalGuests: number;
  totalCapacity: number;
  occupancyRate: number;
  criticalCenters: number; // Centers with >90% occupancy
  availableCapacity: number;
}

export interface ICenterStats {
  currentOccupancy: number;
  totalCapacity: number;
  occupancyRate: number;
  admissionsLast24h: number;
  dischargesLast24h: number;
  transfersIn: number;
  transfersOut: number;
  resourceUtilization: {
    resourceType: string;
    available: number;
    total: number;
    utilizationRate: number;
  }[];
}

export interface ITrendDataPoint {
  timestamp: Date;
  value: number;
}

export type TrendMetric = 
  | 'occupancy'
  | 'admissions'
  | 'discharges'
  | 'transfers';

export type TimeRange = 
  | '24h'
  | '7d'
  | '30d'
  | 'all';

class StatsService {
  /**
   * Calculates overall system statistics
   */
  async calculateSystemStats(): Promise<ISystemStats> {
    try {
      const [centers, totalGuests] = await Promise.all([
        Center.find(),
        Guest.countDocuments({ status: 'active' })
      ]);

      const totalCenters = centers.length;
      const totalCapacity = centers.reduce((sum, center) => sum + center.capacity, 0);
      const currentOccupancy = centers.reduce((sum, center) => sum + center.currentOccupancy, 0);
      const criticalCenters = centers.filter(
        center => (center.currentOccupancy / center.capacity) > 0.9
      ).length;

      return {
        totalCenters,
        totalGuests,
        totalCapacity,
        occupancyRate: (currentOccupancy / totalCapacity) * 100,
        criticalCenters,
        availableCapacity: totalCapacity - currentOccupancy
      };
    } catch (error) {
      throw new ApiError(500, 'Error calculating system stats');
    }
  }

  /**
   * Calculates detailed statistics for a specific center
   */
  async calculateCenterStats(centerId: string): Promise<ICenterStats> {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new ApiError(404, 'Center not found');
      }

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [admissionsLast24h, dischargesLast24h, transferStats] = await Promise.all([
        Guest.countDocuments({
          centerId: center._id,
          admittedAt: { $gte: last24h }
        }),
        Guest.countDocuments({
          centerId: center._id,
          status: 'discharged',
          dischargedAt: { $gte: last24h }
        }),
        Guest.aggregate([
          {
            $match: {
              $or: [
                { centerId: center._id },
                { 'transferHistory.toCenterId': center._id }
              ]
            }
          },
          {
            $group: {
              _id: null,
              transfersIn: {
                $sum: {
                  $size: {
                    $filter: {
                      input: '$transferHistory',
                      as: 'transfer',
                      cond: { $eq: ['$$transfer.toCenterId', center._id] }
                    }
                  }
                }
              },
              transfersOut: {
                $sum: {
                  $size: {
                    $filter: {
                      input: '$transferHistory',
                      as: 'transfer',
                      cond: { $eq: ['$$transfer.fromCenterId', center._id] }
                    }
                  }
                }
              }
            }
          }
        ])
      ]);

      const { transfersIn, transfersOut } = transferStats[0] || { transfersIn: 0, transfersOut: 0 };

      // Calculate resource utilization
      const resourceUtilization = center.resources.map(resource => ({
        resourceType: resource.type,
        available: resource.available,
        total: resource.total,
        utilizationRate: ((resource.total - resource.available) / resource.total) * 100
      }));

      return {
        currentOccupancy: center.currentOccupancy,
        totalCapacity: center.capacity,
        occupancyRate: (center.currentOccupancy / center.capacity) * 100,
        admissionsLast24h,
        dischargesLast24h,
        transfersIn,
        transfersOut,
        resourceUtilization
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error calculating center stats');
    }
  }

  /**
   * Gets trend data for a specific metric over time
   */
  async getTrendData(
    metric: TrendMetric,
    timeRange: TimeRange
  ): Promise<ITrendDataPoint[]> {
    try {
      const rangeInHours = {
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
        'all': 24 * 365 // Default to 1 year for 'all'
      }[timeRange];

      const startDate = new Date(Date.now() - rangeInHours * 60 * 60 * 1000);
      const intervalMinutes = {
        '24h': 60, // 1 hour intervals
        '7d': 60 * 4, // 4 hour intervals
        '30d': 60 * 24, // Daily intervals
        'all': 60 * 24 * 7 // Weekly intervals
      }[timeRange];

      // Build the appropriate aggregation based on metric type
      let aggregation;
      switch (metric) {
        case 'occupancy':
          aggregation = await Center.aggregate([
            {
              $group: {
                _id: null,
                totalOccupancy: { $sum: '$currentOccupancy' },
                totalCapacity: { $sum: '$capacity' }
              }
            }
          ]);
          break;

        case 'admissions':
          aggregation = await Guest.aggregate([
            {
              $match: {
                admittedAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: '$admittedAt',
                    unit: 'minute',
                    binSize: intervalMinutes
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]);
          break;

        case 'discharges':
          aggregation = await Guest.aggregate([
            {
              $match: {
                status: 'discharged',
                dischargedAt: { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: '$dischargedAt',
                    unit: 'minute',
                    binSize: intervalMinutes
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]);
          break;

        case 'transfers':
          aggregation = await Guest.aggregate([
            { $unwind: '$transferHistory' },
            {
              $match: {
                'transferHistory.transferredAt': { $gte: startDate }
              }
            },
            {
              $group: {
                _id: {
                  $dateTrunc: {
                    date: '$transferHistory.transferredAt',
                    unit: 'minute',
                    binSize: intervalMinutes
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ]);
          break;
      }

      return aggregation.map(point => ({
        timestamp: point._id,
        value: metric === 'occupancy'
          ? (point.totalOccupancy / point.totalCapacity) * 100
          : point.count
      }));
    } catch (error) {
      throw new ApiError(500, 'Error getting trend data');
    }
  }
}

export const statsService = new StatsService();