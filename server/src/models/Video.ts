import mongoose, { Document, Schema } from 'mongoose';

export type VideoCategory = 'training' | 'awareness' | 'procedure' | 'other';

export interface IVideo {
  title: string;
  description?: string;
  videoId?: string; // YouTube ID or file reference
  category?: VideoCategory;
  duration?: number; // seconds
  thumbnailUrl?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVideoDocument extends IVideo, Document {}

const VideoSchema = new Schema<IVideoDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    videoId: { type: String, trim: true, index: true },
    category: { type: String, enum: ['training', 'awareness', 'procedure', 'other'], default: 'other', index: true },
    duration: { type: Number, min: 0 },
    thumbnailUrl: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

VideoSchema.index({ title: 'text', description: 'text' });

export const VideoModel = mongoose.model<IVideoDocument>('Video', VideoSchema);
export default VideoModel;
