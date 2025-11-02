import { Request, Response } from 'express';
import { Model, Document } from 'mongoose';

export class BaseController<T extends Document> {
  constructor(private model: Model<T>) {}

  // Get all resources
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.model.find();
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Get single resource by ID
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.model.findById(req.params.id);
      if (!item) {
        res.status(404).json({ success: false, error: 'Resource not found' });
        return;
      }
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Create new resource
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const newItem = new this.model(req.body);
      const savedItem = await newItem.save();
      res.status(201).json({ success: true, data: savedItem });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Update resource
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedItem = await this.model.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedItem) {
        res.status(404).json({ success: false, error: 'Resource not found' });
        return;
      }
      res.json({ success: true, data: updatedItem });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Invalid data provided' });
    }
  };

  // Delete resource
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedItem = await this.model.findByIdAndDelete(req.params.id);
      if (!deletedItem) {
        res.status(404).json({ success: false, error: 'Resource not found' });
        return;
      }
      res.json({ success: true, data: deletedItem });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}