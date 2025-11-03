import mongoose, { Document, Schema } from 'mongoose';
import { ICenterDocument } from './Center';

export type Gender = 'male' | 'female' | 'other' | 'unspecified';
export type GuestStatus = 'active' | 'discharged' | 'transferred';

export interface IContactInfo {
  phone?: string;
  email?: string;
}

export interface IGuest {
  firstName: string;
  lastName: string;
  age?: number;
  gender?: Gender;
  contactInfo?: IContactInfo;
  aadharNumber?: string;
  centerId: mongoose.Types.ObjectId | ICenterDocument;
  admittedAt?: Date;
  status: GuestStatus;
  medicalNeeds?: string[];
  specialRequirements?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGuestDocument extends IGuest, Document {
  fullName?: string; // virtual
}

const ContactSchema = new Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false }
);

const GuestSchema = new Schema<IGuestDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    age: { type: Number, min: 0 },
    gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
    contactInfo: { type: ContactSchema, default: {} },
    aadharNumber: { type: String, unique: true, sparse: true, trim: true },
    centerId: { type: Schema.Types.ObjectId, ref: 'Center', required: true, index: true },
    admittedAt: { type: Date, default: () => new Date() },
    status: { type: String, enum: ['active', 'discharged', 'transferred'], default: 'active' },
    medicalNeeds: { type: [String], default: [] },
    specialRequirements: { type: String },
  },
  { timestamps: true }
);

// Virtual fullName
GuestSchema.virtual('fullName').get(function (this: IGuestDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
GuestSchema.index({ aadharNumber: 1 }, { unique: true, sparse: true });
GuestSchema.index({ centerId: 1 });

export const GuestModel = mongoose.model<IGuestDocument>('Guest', GuestSchema);
export default GuestModel;
import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string;
  mobilePhone?: string;
  centerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    gender: { type: String },
    dateOfBirth: { type: String },
    age: { type: String },
    mobilePhone: { type: String },
    centerId: { type: String, required: true }
  },
  { timestamps: true }
);

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
