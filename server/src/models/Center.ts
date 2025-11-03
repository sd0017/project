import mongoose, { Document, Schema } from 'mongoose';
import { IUserDocument } from './User';

export type CenterStatus = 'active' | 'inactive' | 'full';

export interface ILocation {
  address: string;
  // GeoJSON Point [lng, lat] (preferred for 2dsphere index)
  coordinates: { type: 'Point'; coordinates: [number, number] };
}

export interface IResource {
  name: string;
  quantity: number;
  unit?: string;
}

export interface ICenter {
  name: string;
  location: ILocation;
  capacity: number;
  currentOccupancy: number;
  resources: IResource[];
  status: CenterStatus;
  contactInfo?: { phone?: string; email?: string };
  managedBy?: mongoose.Types.ObjectId | IUserDocument;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICenterDocument extends ICenter, Document {
  availableCapacity?: number; // virtual
}

const LocationSchema = new Schema(
  {
    address: { type: String, required: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        // [lng, lat]
      },
    },
  },
  { _id: false }
);

const ResourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String },
  },
  { _id: false }
);

const CenterSchema = new Schema<ICenterDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    location: { type: LocationSchema, required: true },
    capacity: { type: Number, required: true, min: 0 },
    currentOccupancy: { type: Number, default: 0, min: 0 },
    resources: { type: [ResourceSchema], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'full'], default: 'active' },
    contactInfo: {
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    managedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true }
);

// Virtual availableCapacity
CenterSchema.virtual('availableCapacity').get(function (this: ICenterDocument) {
  return Math.max(0, (this.capacity || 0) - (this.currentOccupancy || 0));
});

// 2dsphere index on location.coordinates for geospatial queries
CenterSchema.index({ 'location.coordinates': '2dsphere' });
CenterSchema.index({ name: 1 });

export const CenterModel = mongoose.model<ICenterDocument>('Center', CenterSchema);
export default CenterModel;
