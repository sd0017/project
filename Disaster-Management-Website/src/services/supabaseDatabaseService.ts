import mongoService from './mongoService';

// Re-export existing types for compatibility
export interface RescueCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  currentGuests: number;
  availableCapacity: number;
  waterLevel: number; // 0-100
  foodLevel: number; // 0-100
  phone: string;
  address: string;
  facilities: string[];
  status: 'active' | 'inactive' | 'full';
  lastUpdated: string;
  emergencyContacts: {
    primary: string;
    secondary?: string;
  };
  export const supabaseDatabaseService = new SupabaseDatabaseService();
      throw new Error('DATABASE_UNAVAILABLE');
    }
  }

  // Real-time subscriptions are not supported in this frontend Mongo wrapper.
  subscribeToRescueCenters(_callback: (centers: RescueCenter[]) => void) {
    console.warn('Realtime subscriptions not supported for Mongo in the frontend.');
    return null;
  }

  subscribeToGuests(_callback: (guests: Guest[]) => void) {
    console.warn('Realtime subscriptions not supported for Mongo in the frontend.');
    return null;
  }
}

export const supabaseDatabaseService = new SupabaseDatabaseService();
import mongoService from './mongoService';

// Re-export existing types for compatibility
export interface RescueCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  currentGuests: number;
  availableCapacity: number;
  waterLevel: number; // 0-100
  foodLevel: number; // 0-100
  phone: string;
  address: string;
  facilities: string[];
  status: 'active' | 'inactive' | 'full';
  lastUpdated: string;
  emergencyContacts: {
    primary: string;
    secondary?: string;
  };
  supplies: {
    medical: number; // 0-100
    bedding: number; // 0-100
    clothing: number; // 0-100
  };
  staffCount: number;
  createdAt: string;
  import mongoService from './mongoService';

  // Re-export existing types for compatibility
  export interface RescueCenter {
    id: string;
    name: string;
    lat: number;
    lng: number;
    totalCapacity: number;
    currentGuests: number;
    availableCapacity: number;
    waterLevel: number; // 0-100
    foodLevel: number; // 0-100
    phone: string;
    address: string;
    facilities: string[];
    status: 'active' | 'inactive' | 'full';
    lastUpdated: string;
    emergencyContacts: {
      primary: string;
      secondary?: string;
    };
    supplies: {
      medical: number; // 0-100
      bedding: number; // 0-100
      clothing: number; // 0-100
    };
    staffCount: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface Guest {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    age?: string;
    mobilePhone: string;
    alternateMobile?: string;
    email?: string;
    permanentAddress?: string;
    familyMembers?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    dependents?: string;
    medicalConditions?: string;
    currentMedications?: string;
    allergies?: string;
    disabilityStatus?: string;
    specialNeeds?: string;
    centerId: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface DisasterStats {
    totalCenters: number;
    totalCapacity: number;
    totalOccupancy: number;
    availableSpace: number;
    centersWithCriticalSupplies: number;
    recentlyUpdatedCenters: number;
    averageOccupancyRate: number;
  }

  export interface User {
    id: string;
    email: string;
    role: 'citizen' | 'government' | 'rescue_center';
    employeeId?: string;
    centerId?: string;
    createdAt: string;
    updatedAt: string;
  }

  class SupabaseDatabaseService {
    private isOnline = true;

    // Check if Mongo is configured (frontend VITE_MONGO_URI) or connected via mongoService
    private isMongoConfigured(): boolean {
      try {
        const envUri = (import.meta as any).env?.VITE_MONGO_URI;
        return !!envUri || mongoService.isConnected();
      } catch (err) {
        return mongoService.isConnected();
      }
    }

    // Rescue Center operations
    async getAllCenters(): Promise<RescueCenter[]> {
      if (!this.isMongoConfigured()) {
        console.log('MongoDB not configured, database unavailable');
        throw new Error('DATABASE_UNAVAILABLE');
      }

      try {
        const coll = mongoService.getCollection<RescueCenter>('rescue_centers');
        const docs = await coll.find({}).sort({ createdAt: -1 }).toArray();
        this.isOnline = true;
        return docs as RescueCenter[];
      } catch (err) {
        console.error('Error in getAllCenters', err);
        this.isOnline = false;
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async getCenterById(id: string): Promise<RescueCenter | null> {
      try {
        const coll = mongoService.getCollection<RescueCenter>('rescue_centers');
        const doc = await coll.findOne({ id });
        this.isOnline = true;
        return doc || null;
      } catch (err) {
        console.error('Error in getCenterById', err);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async createCenter(centerData: Omit<RescueCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<RescueCenter> {
      try {
        const now = new Date().toISOString();
        const newCenter = {
          ...centerData,
          id: `RC${Date.now()}`, // Generate a unique ID
          createdAt: now,
          updatedAt: now,
          currentGuests: 0,
          availableCapacity: centerData.totalCapacity,
          lastUpdated: now,
        } as RescueCenter;

        const coll = mongoService.getCollection<RescueCenter>('rescue_centers');
        await coll.insertOne(newCenter);
        this.isOnline = true;

        return newCenter;
      } catch (error) {
        console.log('Database unavailable for createCenter', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async updateCenter(id: string, updates: Partial<RescueCenter>): Promise<RescueCenter> {
      try {
        const coll = mongoService.getCollection<RescueCenter>('rescue_centers');
        const updatedAt = new Date().toISOString();
        await coll.updateOne({ id }, { $set: { ...updates, updatedAt, lastUpdated: updatedAt } });
        const doc = await coll.findOne({ id });
        if (!doc) throw new Error('NOT_FOUND');
        this.isOnline = true;
        return doc as RescueCenter;
      } catch (error) {
        console.log('Database unavailable for updateCenter', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async deleteCenter(id: string): Promise<void> {
      try {
        const guestsColl = mongoService.getCollection<Guest>('guests');
        await guestsColl.deleteMany({ centerId: id });

        const centersColl = mongoService.getCollection<RescueCenter>('rescue_centers');
        await centersColl.deleteOne({ id });
        this.isOnline = true;
      } catch (error) {
        console.log('Database unavailable for deleteCenter', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    // Guest operations
    async getAllGuests(): Promise<Guest[]> {
      if (!this.isMongoConfigured()) {
        console.log('MongoDB not configured, using fallback mode');
        throw new Error('DATABASE_UNAVAILABLE');
      }

      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const docs = await coll.find({}).sort({ createdAt: -1 }).toArray();
        this.isOnline = true;
        return docs as Guest[];
      } catch (error) {
        console.log('Database unavailable for getAllGuests', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async getGuestsByCenter(centerId: string): Promise<Guest[]> {
      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const docs = await coll.find({ centerId }).sort({ createdAt: -1 }).toArray();
        this.isOnline = true;
        return docs as Guest[];
      } catch (error) {
        console.log('Database unavailable for getGuestsByCenter', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async getGuestById(id: string): Promise<Guest | null> {
      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const doc = await coll.findOne({ id });
        this.isOnline = true;
        return doc || null;
      } catch (error) {
        console.log('Database unavailable for getGuestById', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async createGuest(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
      try {
        const now = new Date().toISOString();
        const newGuest = {
          ...guestData,
          id: `GUEST${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          createdAt: now,
          updatedAt: now,
        } as Guest;

        const coll = mongoService.getCollection<Guest>('guests');
        await coll.insertOne(newGuest);

        // Update center capacity
        await this.updateCenterCapacity(newGuest.centerId);

        this.isOnline = true;
        return newGuest;
      } catch (error) {
        console.log('Database unavailable for createGuest', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const updatedAt = new Date().toISOString();
        await coll.updateOne({ id }, { $set: { ...updates, updatedAt } });
        const doc = await coll.findOne({ id });
        if (!doc) throw new Error('NOT_FOUND');
        this.isOnline = true;
        return doc as Guest;
      } catch (error) {
        console.log('Database unavailable for updateGuest', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async deleteGuest(id: string): Promise<void> {
      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const guest = await coll.findOne({ id });
        await coll.deleteOne({ id });
        if (guest) await this.updateCenterCapacity(guest.centerId);
        this.isOnline = true;
      } catch (error) {
        console.log('Database unavailable for deleteGuest', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async searchGuests(query: string): Promise<Guest[]> {
      try {
        const coll = mongoService.getCollection<Guest>('guests');
        const regex = new RegExp(query, 'i');
        const docs = await coll
          .find({ $or: [ { firstName: regex }, { lastName: regex }, { mobilePhone: regex }, { email: regex } ] })
          .sort({ createdAt: -1 })
          .toArray();
        this.isOnline = true;
        return docs as Guest[];
      } catch (error) {
        console.log('Database unavailable for searchGuests', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    // Utility method to update center capacity
    private async updateCenterCapacity(centerId: string): Promise<void> {
      try {
        const guestsColl = mongoService.getCollection<Guest>('guests');
        const centersColl = mongoService.getCollection<RescueCenter>('rescue_centers');

        const currentGuests = await guestsColl.countDocuments({ centerId });

        const center = await centersColl.findOne({ id: centerId });
        if (!center) return;

        const availableCapacity = (center.totalCapacity || 0) - currentGuests;
        const status = currentGuests >= (center.totalCapacity || 0) ? 'full' : 'active';

        await centersColl.updateOne({ id: centerId }, {
          $set: {
            currentGuests,
            availableCapacity,
            status,
            lastUpdated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        });
      } catch (err) {
        console.error('Error updating center capacity', err);
      }
    }

    // Statistics
    async getDisasterStats(): Promise<DisasterStats> {
      try {
        const centersColl = mongoService.getCollection<RescueCenter>('rescue_centers');
        const guestsColl = mongoService.getCollection<Guest>('guests');

        const [centers, guestCount] = await Promise.all([
          centersColl.find({}).toArray(),
          guestsColl.countDocuments(),
        ]);

        const totalCenters = centers.length;
        const totalCapacity = centers.reduce((sum, c) => sum + (c.totalCapacity || 0), 0);
        const totalOccupancy = guestCount;
        const availableSpace = totalCapacity - totalOccupancy;

        const centersWithCriticalSupplies = centers.filter(center =>
          (center.waterLevel || 0) < 30 || (center.foodLevel || 0) < 30 || (center.supplies?.medical || 0) < 30
        ).length;

        const now = new Date();
        const recentlyUpdatedCenters = centers.filter(center => {
          const lastUpdated = new Date(center.lastUpdated);
          const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
          return diffInHours <= 2;
        }).length;

        const averageOccupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

        this.isOnline = true;
        return {
          totalCenters,
          totalCapacity,
          totalOccupancy,
          availableSpace,
          centersWithCriticalSupplies,
          recentlyUpdatedCenters,
          averageOccupancyRate,
        };
      } catch (error) {
        console.log('Database unavailable for getDisasterStats', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    // Authentication methods (users collection)
    async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
      try {
        const now = new Date().toISOString();
        const usersColl = mongoService.getCollection<User>('users');
        const newUser = {
          ...userData,
          id: `USER${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        } as User;
        await usersColl.insertOne(newUser);
        this.isOnline = true;
        return newUser;
      } catch (error) {
        console.log('Database unavailable for createUser', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    async getUserByEmail(email: string): Promise<User | null> {
      try {
        const usersColl = mongoService.getCollection<User>('users');
        const user = await usersColl.findOne({ email });
        this.isOnline = true;
        return user || null;
      } catch (error) {
        console.log('Database unavailable for getUserByEmail', error);
        throw new Error('DATABASE_UNAVAILABLE');
      }
    }

    // Real-time subscriptions are not supported in this frontend Mongo wrapper.
    subscribeToRescueCenters(_callback: (centers: RescueCenter[]) => void) {
      console.warn('Realtime subscriptions not supported for Mongo in the frontend.');
      return null;
    }

    subscribeToGuests(_callback: (guests: Guest[]) => void) {
      console.warn('Realtime subscriptions not supported for Mongo in the frontend.');
      return null;
    }
  }

  export const supabaseDatabaseService = new SupabaseDatabaseService();
        .update({
          current_guests: currentGuests,
          available_capacity: availableCapacity,
          status: status,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', centerId);

    } catch (error) {
      console.error('Error updating center capacity:', error);
    }
  }

  // Statistics
  async getDisasterStats(): Promise<DisasterStats> {
    try {
      const [centersResult, guestsResult] = await Promise.all([
        supabase.from('rescue_centers').select('*'),
        supabase.from('guests').select('center_id')
      ]);

      this.handleSupabaseError(centersResult.error, 'getDisasterStats (centers)');
      this.handleSupabaseError(guestsResult.error, 'getDisasterStats (guests)');

      const centers = centersResult.data || [];
      const guests = guestsResult.data || [];

      const totalCenters = centers.length;
      const totalCapacity = centers.reduce((sum, center) => sum + center.total_capacity, 0);
      const totalOccupancy = guests.length;
      const availableSpace = totalCapacity - totalOccupancy;

      const centersWithCriticalSupplies = centers.filter(center => 
        center.water_level < 30 || center.food_level < 30 || 
        center.supplies?.medical < 30
      ).length;

      const now = new Date();
      const recentlyUpdatedCenters = centers.filter(center => {
        const lastUpdated = new Date(center.last_updated);
        const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        return diffInHours <= 2;
      }).length;

      const averageOccupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

      this.isOnline = true;

      return {
        totalCenters,
        totalCapacity,
        totalOccupancy,
        availableSpace,
        centersWithCriticalSupplies,
        recentlyUpdatedCenters,
        averageOccupancyRate
      };
    } catch (error) {
      console.log('Supabase unavailable for getDisasterStats');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  // Authentication methods
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      this.handleSupabaseError(error, 'createUser');
      this.isOnline = true;

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        employeeId: data.employee_id,
        centerId: data.center_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.log('Supabase unavailable for createUser');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleSupabaseError(error, 'getUserByEmail');
      }

      this.isOnline = true;
      
      return data ? {
        id: data.id,
        email: data.email,
        role: data.role,
        employeeId: data.employee_id,
        centerId: data.center_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } : null;
    } catch (error) {
      console.log('Supabase unavailable for getUserByEmail');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  // Real-time subscriptions
  subscribeToRescueCenters(callback: (centers: RescueCenter[]) => void) {
    if (!this.isOnline) return null;

    return supabase
      .channel('rescue_centers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rescue_centers' }, 
        async () => {
          try {
            const centers = await this.getAllCenters();
            callback(centers);
          } catch (error) {
            console.error('Error in real-time rescue centers subscription:', error);
          }
        }
      )
      .subscribe();
  }

  subscribeToGuests(callback: (guests: Guest[]) => void) {
    if (!this.isOnline) return null;

    return supabase
      .channel('guests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'guests' }, 
        async () => {
          try {
            const guests = await this.getAllGuests();
            callback(guests);
          } catch (error) {
            console.error('Error in real-time guests subscription:', error);
          }
        }
      )
      .subscribe();
  }
}

export const supabaseDatabaseService = new SupabaseDatabaseService();