import mongoose, { Document, Schema } from 'mongoose';

export type EmergencyCallStatus =
  | 'initiated'
  | 'calling_primary'
  | 'calling_secondary'
  | 'connected'
  | 'failed'
  | 'completed';

export interface IEmergencyCall {
  userId?: mongoose.Types.ObjectId;
  primaryNumber: string;
  secondaryNumber?: string;
  emergencyType?: string;
  location?: { address?: string; coordinates?: { type: 'Point'; coordinates: [number, number] } };
  status: EmergencyCallStatus;
  callSid?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IEmergencyCallDocument extends IEmergencyCall, Document {}

const LocationSchema = new Schema(
  {
    address: { type: String },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: { type: [Number] },
    },
  },
  { _id: false }
);

const EmergencyCallSchema = new Schema<IEmergencyCallDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    primaryNumber: { type: String, required: true, trim: true },
    secondaryNumber: { type: String, trim: true },
    emergencyType: { type: String, trim: true },
    location: { type: LocationSchema, required: false },
    status: {
      type: String,
      enum: ['initiated', 'calling_primary', 'calling_secondary', 'connected', 'failed', 'completed'],
      default: 'initiated',
    },
    callSid: { type: String, trim: true },
  },
  { timestamps: true }
);

EmergencyCallSchema.index({ 'location.coordinates': '2dsphere' });
EmergencyCallSchema.index({ status: 1 });

export const EmergencyCallModel = mongoose.model<IEmergencyCallDocument>('EmergencyCall', EmergencyCallSchema);
export default EmergencyCallModel;
