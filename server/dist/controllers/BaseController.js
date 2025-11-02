"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
class BaseController {
    constructor(model) {
        this.model = model;
        // Get all resources
        this.getAll = async (req, res) => {
            try {
                const items = await this.model.find();
                res.json({ success: true, data: items });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Get single resource by ID
        this.getById = async (req, res) => {
            try {
                const item = await this.model.findById(req.params.id);
                if (!item) {
                    res.status(404).json({ success: false, error: 'Resource not found' });
                    return;
                }
                res.json({ success: true, data: item });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Create new resource
        this.create = async (req, res) => {
            try {
                const newItem = new this.model(req.body);
                const savedItem = await newItem.save();
                res.status(201).json({ success: true, data: savedItem });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Update resource
        this.update = async (req, res) => {
            try {
                const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
                if (!updatedItem) {
                    res.status(404).json({ success: false, error: 'Resource not found' });
                    return;
                }
                res.json({ success: true, data: updatedItem });
            }
            catch (error) {
                res.status(400).json({ success: false, error: 'Invalid data provided' });
            }
        };
        // Delete resource
        this.delete = async (req, res) => {
            try {
                const deletedItem = await this.model.findByIdAndDelete(req.params.id);
                if (!deletedItem) {
                    res.status(404).json({ success: false, error: 'Resource not found' });
                    return;
                }
                res.json({ success: true, data: deletedItem });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
    }
}
exports.BaseController = BaseController;
