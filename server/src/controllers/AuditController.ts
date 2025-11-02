import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuditLog, IAuditLog } from '../models/AuditLog';

export class AuditController extends BaseController<IAuditLog> {
  constructor() {
    super(AuditLog);
  }

  // Log an audit event
  logEvent = async (
    userId: string,
    action: string,
    resourceType: 'user' | 'rescue-center' | 'guest' | 'system',
    resourceId?: string,
    details?: any,
    req?: Request
  ): Promise<IAuditLog> => {
    const auditLog = new AuditLog({
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
  getResourceLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resourceType, resourceId } = req.params;
      const logs = await AuditLog.find({ 
        resourceType, 
        resourceId 
      }).sort({ createdAt: -1 });

      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Get user activity logs
  getUserLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const logs = await AuditLog.find({ 
        userId 
      }).sort({ createdAt: -1 });

      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };

  // Get system activity logs
  getSystemLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await AuditLog.find({ 
        resourceType: 'system' 
      }).sort({ createdAt: -1 });

      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}