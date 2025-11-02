"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const BaseController_1 = require("./BaseController");
const AuditLog_1 = require("../models/AuditLog");
class AuditController extends BaseController_1.BaseController {
    constructor() {
        super(AuditLog_1.AuditLog);
        // Log an audit event
        this.logEvent = async (userId, action, resourceType, resourceId, details, req) => {
            const auditLog = new AuditLog_1.AuditLog({
                userId,
                action,
                resourceType,
                resourceId,
                details,
                ip: req?.ip,
                userAgent: req?.get('user-agent')
            });
            return auditLog.save();
        };
        // Get audit logs for a specific resource
        this.getResourceLogs = async (req, res) => {
            try {
                const { resourceType, resourceId } = req.params;
                const logs = await AuditLog_1.AuditLog.find({
                    resourceType,
                    resourceId
                }).sort({ createdAt: -1 });
                res.json({ success: true, data: logs });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Get user activity logs
        this.getUserLogs = async (req, res) => {
            try {
                const { userId } = req.params;
                const logs = await AuditLog_1.AuditLog.find({
                    userId
                }).sort({ createdAt: -1 });
                res.json({ success: true, data: logs });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
        // Get system activity logs
        this.getSystemLogs = async (req, res) => {
            try {
                const logs = await AuditLog_1.AuditLog.find({
                    resourceType: 'system'
                }).sort({ createdAt: -1 });
                res.json({ success: true, data: logs });
            }
            catch (error) {
                res.status(500).json({ success: false, error: 'Internal server error' });
            }
        };
    }
}
exports.AuditController = AuditController;
