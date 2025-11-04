import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'citizen' | 'government' | 'rescue-center' | 'admin';

export interface IUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  fullName?: string; // virtual
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: (props: any) => `${props.value} is not a valid email address`,
      },
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['citizen', 'government', 'rescue-center', 'admin'],
      default: 'citizen',
      required: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: (v: string) => !v || /^\+?[0-9\- ]{7,20}$/.test(v),
        message: (props: any) => `${props.value} is not a valid phone number`,
      },
    },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });

// Virtuals
UserSchema.virtual('fullName').get(function (this: IUserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hooks
UserSchema.pre('save', function (next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
export default UserModel;
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  role: 'citizen' | 'government' | 'rescue-center';
  employeeId?: string;
  centerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    role: { type: String, enum: ['citizen', 'government', 'rescue-center'], default: 'citizen' },
    employeeId: { type: String },
    centerId: { type: String }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
