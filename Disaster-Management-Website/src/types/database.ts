import { ObjectId } from 'mongodb';

// Base interface for all documents
interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Types for rescue centers
export interface RescueCenter extends BaseDocument {
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  totalCapacity: number;
  currentGuests: number;
  availableCapacity: number;
  resources: {
    water: number; // 0-100
    food: number; // 0-100
    medical: number; // 0-100
    bedding: number; // 0-100
    clothing: number; // 0-100
  };
  contact: {
    phone: string;
    emergency: {
      primary: string;
      secondary?: string;
    };
  };
  address: string;
  facilities: string[];
  status: 'active' | 'inactive' | 'full' | 'maintenance';
  staffCount: number;
  lastUpdated: Date;
}

// Types for guests
export interface Guest extends BaseDocument {
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth?: Date;
    age?: number;
    gender?: string;
    aadharNumber?: string;
  };
  contact: {
    phone: string;
    alternatePhone?: string;
    email?: string;
    address?: string;
  };
  emergency: {
    contactName?: string;
    contactPhone?: string;
    relation?: string;
  };
  medical: {
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    specialNeeds?: string;
  };
  stay: {
    centerId: ObjectId;
    status: 'admitted' | 'discharged' | 'transferred';
    admittedAt: Date;
    dischargedAt?: Date;
    transferredTo?: ObjectId;
  };
  family: {
    size?: number;
    members?: string[];
  };
}

// Types for disaster statistics
export interface DisasterStats extends BaseDocument {
  totalCenters: number;
  totalGuests: number;
  availableCapacity: number;
  occupancyRate: number;
  resourceStatus: {
    water: number; // 0-100
    food: number; // 0-100
    medical: number; // 0-100
  };
  criticalCenters: number;
  lastUpdated: Date;
}

// Types for notifications
export interface Notification extends BaseDocument {
  type: 'alert' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target: {
    centerId?: ObjectId;
    userId?: ObjectId;
    role?: 'admin' | 'staff' | 'guest' | 'all';
  };
  read: boolean;
  expiresAt?: Date;
}

// Types for audit logs
export interface AuditLog extends BaseDocument {
  action: string;
  entityType: 'center' | 'guest' | 'user' | 'notification';
  entityId: ObjectId;
  changes: {
    before: any;
    after: any;
  };
  metadata: {
    userId?: ObjectId;
    ip?: string;
    userAgent?: string;
  };
}

// Types for disaster stats
export interface DisasterStats {
  totalCenters: number;
  totalGuests: number;
  availableCapacity: number;
  occupancyRate: number;
  criticalCenters: number;
  resourceStatus: {
    water: number;
    food: number;
    medical: number;
  };
  lastUpdated: string;
}

// Types for socket events
export interface SocketEvents {
  'guest:created': (guest: Guest) => void;
  'guest:updated': (guest: Guest) => void;
  'guest:deleted': (data: { id: string }) => void;
  'center:updated': (center: RescueCenter) => void;
  'notification:new': (notification: any) => void;
}

// Types for database operations
export interface DatabaseOperations {
  getRescueCenters(): Promise<RescueCenter[]>;
  getRescueCenterById(id: string): Promise<RescueCenter | null>;
  updateRescueCenter(id: string, updates: Partial<RescueCenter>): Promise<RescueCenter>;
  addRescueCenter(centerData: Omit<RescueCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<RescueCenter>;
  deleteRescueCenter(id: string): Promise<void>;
  getGuestsByCenter(centerId: string): Promise<Guest[]>;
  getAllGuests(): Promise<Guest[]>;
  getGuestById(id: string): Promise<Guest | null>;
  addGuest(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest>;
  updateGuest(id: string, updates: Partial<Guest>): Promise<Guest>;
  deleteGuest(id: string): Promise<void>;
  getDisasterStats(): Promise<DisasterStats>;
  searchGuests(query: string): Promise<Guest[]>;
}