import { Types } from 'mongoose';
import Center, { ICenter } from '../models/Center';
import { ApiError } from '../utils/ApiError';
import { Point } from 'geojson';

export interface ICenterAvailability {
  centerId: string;
  currentOccupancy: number;
  totalCapacity: number;
  availableCapacity: number;
  occupancyPercentage: number;
}

export interface INearbyCenter extends ICenterAvailability {
  name: string;
  location: Point;
  distanceKm: number;
}

class CenterService {
  /**
   * Validates if a center has enough capacity for additional guests
   */
  async validateCenterCapacity(
    centerId: string,
    additionalGuests: number
  ): Promise<boolean> {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new ApiError(404, 'Center not found');
      }

      const projectedOccupancy = center.currentOccupancy + additionalGuests;
      return projectedOccupancy <= center.capacity;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error validating center capacity');
    }
  }

  /**
   * Updates center occupancy by the given delta (positive or negative)
   */
  async updateCenterOccupancy(
    centerId: string,
    delta: number
  ): Promise<ICenterAvailability> {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new ApiError(404, 'Center not found');
      }

      const newOccupancy = center.currentOccupancy + delta;
      if (newOccupancy < 0) {
        throw new ApiError(400, 'Occupancy cannot be negative');
      }
      if (newOccupancy > center.capacity) {
        throw new ApiError(400, 'Center capacity exceeded');
      }

      center.currentOccupancy = newOccupancy;
      await center.save();

      return {
        centerId: center._id.toString(),
        currentOccupancy: center.currentOccupancy,
        totalCapacity: center.capacity,
        availableCapacity: center.capacity - center.currentOccupancy,
        occupancyPercentage: (center.currentOccupancy / center.capacity) * 100
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error updating center occupancy');
    }
  }

  /**
   * Gets detailed availability information for a center
   */
  async getCenterAvailability(centerId: string): Promise<ICenterAvailability> {
    try {
      const center = await Center.findById(centerId);
      if (!center) {
        throw new ApiError(404, 'Center not found');
      }

      return {
        centerId: center._id.toString(),
        currentOccupancy: center.currentOccupancy,
        totalCapacity: center.capacity,
        availableCapacity: center.capacity - center.currentOccupancy,
        occupancyPercentage: (center.currentOccupancy / center.capacity) * 100
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error getting center availability');
    }
  }

  /**
   * Finds nearby centers within the given radius that have available capacity
   */
  async findNearbyAvailableCenters(
    location: Point,
    radiusKm: number
  ): Promise<INearbyCenter[]> {
    try {
      // Convert km to radians (Earth's radius ≈ 6371 km)
      const radiusRadians = radiusKm / 6371;

      const nearbyCenters = await Center.find({
        location: {
          $geoWithin: {
            $centerSphere: [location.coordinates, radiusRadians]
          }
        },
        $expr: {
          $lt: ['$currentOccupancy', '$capacity']
        }
      }).exec();

      const centersWithDistance = nearbyCenters.map(center => {
        // Calculate distance using MongoDB's $geoNear aggregation
        const distance = this.calculateDistance(
          location.coordinates,
          center.location.coordinates
        );

        return {
          centerId: center._id.toString(),
          name: center.name,
          location: center.location,
          currentOccupancy: center.currentOccupancy,
          totalCapacity: center.capacity,
          availableCapacity: center.capacity - center.currentOccupancy,
          occupancyPercentage: (center.currentOccupancy / center.capacity) * 100,
          distanceKm: distance
        };
      });

      // Sort by distance
      return centersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    } catch (error) {
      throw new ApiError(500, 'Error finding nearby centers');
    }
  }

  /**
   * Calculate distance between two points using the Haversine formula
   */
  private calculateDistance(
    point1: number[],
    point2: number[]
  ): number {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

export const centerService = new CenterService();