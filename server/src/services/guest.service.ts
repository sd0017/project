import { Types } from 'mongoose';
import Guest, { IGuest } from '../models/Guest';
import { centerService } from './center.service';
import { ApiError } from '../utils/ApiError';

export interface IGuestAdmission extends Omit<IGuest, '_id'> {
  centerId: string;
}

class GuestService {
  /**
   * Admits a new guest to a center
   */
  async admitGuest(guestData: IGuestAdmission): Promise<IGuest> {
    try {
      // Validate center capacity first
      const hasCapacity = await centerService.validateCenterCapacity(
        guestData.centerId,
        1
      );
      if (!hasCapacity) {
        throw new ApiError(400, 'Center is at full capacity');
      }

      // Start a transaction
      const session = await Guest.startSession();
      let admittedGuest: IGuest;

      try {
        await session.withTransaction(async () => {
          // Create guest
          admittedGuest = await Guest.create([guestData], { session })[0];

          // Update center occupancy
          await centerService.updateCenterOccupancy(guestData.centerId, 1);
        });

        await session.endSession();
        return admittedGuest!;
      } catch (error) {
        await session.endSession();
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error admitting guest');
    }
  }

  /**
   * Discharges a guest from their current center
   */
  async dischargeGuest(guestId: string): Promise<void> {
    try {
      const guest = await Guest.findById(guestId);
      if (!guest) {
        throw new ApiError(404, 'Guest not found');
      }

      const session = await Guest.startSession();
      try {
        await session.withTransaction(async () => {
          // Update guest status
          await Guest.findByIdAndUpdate(
            guestId,
            {
              status: 'discharged',
              dischargedAt: new Date()
            },
            { session }
          );

          // Decrease center occupancy
          await centerService.updateCenterOccupancy(guest.centerId.toString(), -1);
        });

        await session.endSession();
      } catch (error) {
        await session.endSession();
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error discharging guest');
    }
  }

  /**
   * Transfers a guest from one center to another
   */
  async transferGuest(
    guestId: string,
    targetCenterId: string
  ): Promise<IGuest> {
    try {
      const guest = await Guest.findById(guestId);
      if (!guest) {
        throw new ApiError(404, 'Guest not found');
      }

      if (guest.centerId.toString() === targetCenterId) {
        throw new ApiError(400, 'Guest is already in this center');
      }

      // Validate target center capacity
      const hasCapacity = await centerService.validateCenterCapacity(
        targetCenterId,
        1
      );
      if (!hasCapacity) {
        throw new ApiError(400, 'Target center is at full capacity');
      }

      const session = await Guest.startSession();
      try {
        await session.withTransaction(async () => {
          // Update guest's center
          const sourceCenterId = guest.centerId;
          guest.centerId = new Types.ObjectId(targetCenterId);
          guest.transferHistory.push({
            fromCenterId: sourceCenterId,
            toCenterId: new Types.ObjectId(targetCenterId),
            transferredAt: new Date()
          });
          await guest.save({ session });

          // Update both centers' occupancy
          await Promise.all([
            centerService.updateCenterOccupancy(sourceCenterId.toString(), -1),
            centerService.updateCenterOccupancy(targetCenterId, 1)
          ]);
        });

        await session.endSession();
        return guest;
      } catch (error) {
        await session.endSession();
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Error transferring guest');
    }
  }

  /**
   * Searches for guests by Aadhar number
   */
  async searchGuestsByAadhar(aadharNumber: string): Promise<IGuest[]> {
    try {
      return await Guest.find({ aadharNumber })
        .populate('centerId', 'name location')
        .sort({ admittedAt: -1 })
        .exec();
    } catch (error) {
      throw new ApiError(500, 'Error searching guests by Aadhar');
    }
  }
}

export const guestService = new GuestService();