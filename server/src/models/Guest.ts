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
