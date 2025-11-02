import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  resourceType: 'user' | 'rescue-center' | 'guest' | 'system';
  resourceId?: string;
  details: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    action: { type: String, required: true },
    resourceType: { 
      type: String, 
      enum: ['user', 'rescue-center', 'guest', 'system'],
      required: true 
    },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String }
  },
  { 
    timestamps: { 
      createdAt: true,
      updatedAt: false // We don't need updatedAt for audit logs
    } 
  }
);

// Indexes for faster queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);