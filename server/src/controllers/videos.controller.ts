import { Request, Response } from 'express';
import mongoose from 'mongoose';
import VideoModel from '../models/Video';

// GET /api/videos
export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const { category, q, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));

    const filter: any = {};
    if (category) filter.category = category;

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const total = await VideoModel.countDocuments(filter);
    const videos = await VideoModel.find(filter).sort(sort).skip((pageNum - 1) * limitNum).limit(limitNum).lean();

    return res.json({ videos, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) || 1 } });
  } catch (err) {
    console.error('getAllVideos error', err);
    return res.status(500).json({ error: 'Unable to fetch videos' });
  }
};

// GET /api/videos/:id
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid video id' });

    // increment view count atomically
    const video = await VideoModel.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
    if (!video) return res.status(404).json({ error: 'Video not found' });

    return res.json({ video });
  } catch (err) {
    console.error('getVideoById error', err);
    return res.status(500).json({ error: 'Unable to fetch video' });
  }
};

// POST /api/videos
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || (user.role !== 'admin' && user.role !== 'government')) return res.status(403).json({ error: 'Forbidden' });

    const { title, description, videoId, category = 'other', duration, thumbnailUrl } = req.body;
    if (!title || !videoId) return res.status(400).json({ error: 'title and videoId are required' });

    const doc = new VideoModel({ title, description, videoId, category, duration, thumbnailUrl, uploadedBy: user._id });
    await doc.save();

    return res.status(201).json({ video: doc });
  } catch (err) {
    console.error('uploadVideo error', err);
    return res.status(500).json({ error: 'Unable to upload video' });
  }
};

// PUT /api/videos/:id
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid video id' });

    const user = (req as any).user;
    if (!user || (user.role !== 'admin' && user.role !== 'government')) return res.status(403).json({ error: 'Forbidden' });

    const updates = req.body;
    // prevent incrementing views manually
    if ('views' in updates) delete updates.views;

    const video = await VideoModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!video) return res.status(404).json({ error: 'Video not found' });

    return res.json({ video });
  } catch (err) {
    console.error('updateVideo error', err);
    return res.status(500).json({ error: 'Unable to update video' });
  }
};

// DELETE /api/videos/:id
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid video id' });

    const user = (req as any).user;
    if (!user || (user.role !== 'admin' && user.role !== 'government')) return res.status(403).json({ error: 'Forbidden' });

    const video = await VideoModel.findById(id);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    await video.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteVideo error', err);
    return res.status(500).json({ error: 'Unable to delete video' });
  }
};

export default { getAllVideos, getVideoById, uploadVideo, updateVideo, deleteVideo };
