import mongoose, { Schema, Document } from 'mongoose';

export interface IRescueCenter extends Document {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  currentGuests: number;
  availableCapacity: number;
  waterLevel: number;
  foodLevel: number;
  phone?: string;
  address?: string;
  facilities: string[];
  status: 'active' | 'inactive' | 'full';
  lastUpdated: Date;
  supplies: any;
  staffCount: number;
}

const RescueCenterSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    totalCapacity: { type: Number, required: true },
    currentGuests: { type: Number, default: 0 },
    availableCapacity: { type: Number, default: 0 },
    waterLevel: { type: Number, default: 0 },
    foodLevel: { type: Number, default: 0 },
    phone: { type: String },
    address: { type: String },
    facilities: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive', 'full'], default: 'active' },
    lastUpdated: { type: Date, default: Date.now },
    supplies: { type: Schema.Types.Mixed, default: {} },
    staffCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const RescueCenter = mongoose.model<IRescueCenter>('RescueCenter', RescueCenterSchema);
