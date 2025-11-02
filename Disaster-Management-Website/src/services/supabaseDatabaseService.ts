import { supabase, Database } from '../utils/supabase/client';
import { ENV } from '../utils/env';
import { PostgrestError } from '@supabase/supabase-js';

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

// Type aliases for Supabase database rows
type SupabaseRescueCenter = Database['public']['Tables']['rescue_centers']['Row'];
type SupabaseGuest = Database['public']['Tables']['guests']['Row'];
type SupabaseUser = Database['public']['Tables']['users']['Row'];

class SupabaseDatabaseService {
  private isOnline = true;
  private connectionTimeout = 10000; // 10 seconds timeout
  
  // Create a promise that rejects after a timeout
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number = this.connectionTimeout): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
      )
    ]);
  }
  
  // Utility methods for data transformation
  private mapSupabaseCenterToLocal(supabaseCenter: SupabaseRescueCenter): RescueCenter {
    return {
      id: supabaseCenter.id,
      name: supabaseCenter.name,
      lat: supabaseCenter.lat,
      lng: supabaseCenter.lng,
      totalCapacity: supabaseCenter.total_capacity,
      currentGuests: supabaseCenter.current_guests,
      availableCapacity: supabaseCenter.available_capacity,
      waterLevel: supabaseCenter.water_level,
      foodLevel: supabaseCenter.food_level,
      phone: supabaseCenter.phone,
      address: supabaseCenter.address,
      facilities: supabaseCenter.facilities,
      status: supabaseCenter.status,
      lastUpdated: supabaseCenter.last_updated,
      emergencyContacts: supabaseCenter.emergency_contacts,
      supplies: supabaseCenter.supplies,
      staffCount: supabaseCenter.staff_count,
      createdAt: supabaseCenter.created_at,
      updatedAt: supabaseCenter.updated_at,
    };
  }

  private mapLocalCenterToSupabase(localCenter: Partial<RescueCenter>): Database['public']['Tables']['rescue_centers']['Insert'] {
    return {
      id: localCenter.id,
      name: localCenter.name!,
      lat: localCenter.lat!,
      lng: localCenter.lng!,
      total_capacity: localCenter.totalCapacity!,
      current_guests: localCenter.currentGuests || 0,
      available_capacity: localCenter.availableCapacity || localCenter.totalCapacity || 0,
      water_level: localCenter.waterLevel!,
      food_level: localCenter.foodLevel!,
      phone: localCenter.phone!,
      address: localCenter.address!,
      facilities: localCenter.facilities!,
      status: localCenter.status || 'active',
      last_updated: localCenter.lastUpdated || new Date().toISOString(),
      emergency_contacts: localCenter.emergencyContacts!,
      supplies: localCenter.supplies!,
      staff_count: localCenter.staffCount!,
      created_at: localCenter.createdAt,
      updated_at: localCenter.updatedAt || new Date().toISOString(),
    };
  }

  private mapSupabaseGuestToLocal(supabaseGuest: SupabaseGuest): Guest {
    return {
      id: supabaseGuest.id,
      firstName: supabaseGuest.first_name,
      middleName: supabaseGuest.middle_name,
      lastName: supabaseGuest.last_name,
      gender: supabaseGuest.gender,
      dateOfBirth: supabaseGuest.date_of_birth,
      age: supabaseGuest.age,
      mobilePhone: supabaseGuest.mobile_phone,
      alternateMobile: supabaseGuest.alternate_mobile,
      email: supabaseGuest.email,
      permanentAddress: supabaseGuest.permanent_address,
      familyMembers: supabaseGuest.family_members,
      emergencyContactName: supabaseGuest.emergency_contact_name,
      emergencyContactPhone: supabaseGuest.emergency_contact_phone,
      emergencyContactRelation: supabaseGuest.emergency_contact_relation,
      dependents: supabaseGuest.dependents,
      medicalConditions: supabaseGuest.medical_conditions,
      currentMedications: supabaseGuest.current_medications,
      allergies: supabaseGuest.allergies,
      disabilityStatus: supabaseGuest.disability_status,
      specialNeeds: supabaseGuest.special_needs,
      centerId: supabaseGuest.center_id,
      createdAt: supabaseGuest.created_at,
      updatedAt: supabaseGuest.updated_at,
    };
  }

  private mapLocalGuestToSupabase(localGuest: Partial<Guest>): Database['public']['Tables']['guests']['Insert'] {
    return {
      id: localGuest.id,
      first_name: localGuest.firstName!,
      middle_name: localGuest.middleName,
      last_name: localGuest.lastName!,
      gender: localGuest.gender!,
      date_of_birth: localGuest.dateOfBirth,
      age: localGuest.age,
      mobile_phone: localGuest.mobilePhone!,
      alternate_mobile: localGuest.alternateMobile,
      email: localGuest.email,
      permanent_address: localGuest.permanentAddress,
      family_members: localGuest.familyMembers,
      emergency_contact_name: localGuest.emergencyContactName,
      emergency_contact_phone: localGuest.emergencyContactPhone,
      emergency_contact_relation: localGuest.emergencyContactRelation,
      dependents: localGuest.dependents,
      medical_conditions: localGuest.medicalConditions,
      current_medications: localGuest.currentMedications,
      allergies: localGuest.allergies,
      disability_status: localGuest.disabilityStatus,
      special_needs: localGuest.specialNeeds,
      center_id: localGuest.centerId!,
      created_at: localGuest.createdAt,
      updated_at: localGuest.updatedAt || new Date().toISOString(),
    };
  }

  // Error handling for offline mode
  private handleSupabaseError(error: PostgrestError | null, operation: string) {
    if (error) {
      console.error(`Supabase ${operation} error:`, error.message);
      this.isOnline = false;
      throw new Error(`SUPABASE_UNAVAILABLE: ${error.message}`);
    }
  }

  // Check if Supabase is properly configured
  private isSupabaseConfigured(): boolean {
    try {
      return ENV.isSupabaseConfigured();
    } catch (error) {
      console.log('Supabase configuration check failed, using offline mode');
      return false;
    }
  }

  // Rescue Center operations
  async getAllCenters(): Promise<RescueCenter[]> {
    if (!this.isSupabaseConfigured()) {
      console.log('Supabase not configured, using fallback mode');
      throw new Error('SUPABASE_UNAVAILABLE');
    }

    try {
      const query = supabase
        .from('rescue_centers')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await this.withTimeout(query);

      this.handleSupabaseError(error, 'getAllCenters');
      this.isOnline = true;

      return (data || []).map(this.mapSupabaseCenterToLocal);
    } catch (error) {
      console.log('Supabase unavailable, falling back to local data:', error);
      this.isOnline = false;
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async getCenterById(id: string): Promise<RescueCenter | null> {
    try {
      const { data, error } = await supabase
        .from('rescue_centers')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        this.handleSupabaseError(error, 'getCenterById');
      }

      this.isOnline = true;
      return data ? this.mapSupabaseCenterToLocal(data) : null;
    } catch (error) {
      console.log('Supabase unavailable for getCenterById');
      throw new Error('SUPABASE_UNAVAILABLE');
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
      };

      const supabaseData = this.mapLocalCenterToSupabase(newCenter);
      
      const { data, error } = await supabase
        .from('rescue_centers')
        .insert([supabaseData])
        .select()
        .single();

      this.handleSupabaseError(error, 'createCenter');
      this.isOnline = true;

      return this.mapSupabaseCenterToLocal(data);
    } catch (error) {
      console.log('Supabase unavailable for createCenter');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async updateCenter(id: string, updates: Partial<RescueCenter>): Promise<RescueCenter> {
    try {
      const updateData = this.mapLocalCenterToSupabase({
        ...updates,
        updatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('rescue_centers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      this.handleSupabaseError(error, 'updateCenter');
      this.isOnline = true;

      return this.mapSupabaseCenterToLocal(data);
    } catch (error) {
      console.log('Supabase unavailable for updateCenter');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async deleteCenter(id: string): Promise<void> {
    try {
      // First delete all guests in the center
      await supabase
        .from('guests')
        .delete()
        .eq('center_id', id);

      // Then delete the center
      const { error } = await supabase
        .from('rescue_centers')
        .delete()
        .eq('id', id);

      this.handleSupabaseError(error, 'deleteCenter');
      this.isOnline = true;
    } catch (error) {
      console.log('Supabase unavailable for deleteCenter');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  // Guest operations
  async getAllGuests(): Promise<Guest[]> {
    if (!this.isSupabaseConfigured()) {
      console.log('Supabase not configured, using fallback mode');
      throw new Error('SUPABASE_UNAVAILABLE');
    }

    try {
      const query = supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await this.withTimeout(query);

      this.handleSupabaseError(error, 'getAllGuests');
      this.isOnline = true;

      return (data || []).map(this.mapSupabaseGuestToLocal);
    } catch (error) {
      console.log('Supabase unavailable for getAllGuests');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async getGuestsByCenter(centerId: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('center_id', centerId)
        .order('created_at', { ascending: false });

      this.handleSupabaseError(error, 'getGuestsByCenter');
      this.isOnline = true;

      return (data || []).map(this.mapSupabaseGuestToLocal);
    } catch (error) {
      console.log('Supabase unavailable for getGuestsByCenter');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async getGuestById(id: string): Promise<Guest | null> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleSupabaseError(error, 'getGuestById');
      }

      this.isOnline = true;
      return data ? this.mapSupabaseGuestToLocal(data) : null;
    } catch (error) {
      console.log('Supabase unavailable for getGuestById');
      throw new Error('SUPABASE_UNAVAILABLE');
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
      };

      const supabaseData = this.mapLocalGuestToSupabase(newGuest);
      
      const { data, error } = await supabase
        .from('guests')
        .insert([supabaseData])
        .select()
        .single();

      this.handleSupabaseError(error, 'createGuest');

      // Update center capacity
      await this.updateCenterCapacity(guestData.centerId);
      
      this.isOnline = true;
      return this.mapSupabaseGuestToLocal(data);
    } catch (error) {
      console.log('Supabase unavailable for createGuest');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      const updateData = this.mapLocalGuestToSupabase({
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('guests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      this.handleSupabaseError(error, 'updateGuest');
      this.isOnline = true;

      return this.mapSupabaseGuestToLocal(data);
    } catch (error) {
      console.log('Supabase unavailable for updateGuest');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async deleteGuest(id: string): Promise<void> {
    try {
      // Get the guest to find their center ID before deletion
      const guest = await this.getGuestById(id);
      
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

      this.handleSupabaseError(error, 'deleteGuest');

      // Update center capacity if we found the guest
      if (guest) {
        await this.updateCenterCapacity(guest.centerId);
      }
      
      this.isOnline = true;
    } catch (error) {
      console.log('Supabase unavailable for deleteGuest');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  async searchGuests(query: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,mobile_phone.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      this.handleSupabaseError(error, 'searchGuests');
      this.isOnline = true;

      return (data || []).map(this.mapSupabaseGuestToLocal);
    } catch (error) {
      console.log('Supabase unavailable for searchGuests');
      throw new Error('SUPABASE_UNAVAILABLE');
    }
  }

  // Utility method to update center capacity
  private async updateCenterCapacity(centerId: string): Promise<void> {
    try {
      // Get current guest count for the center
      const { data: guests, error: guestError } = await supabase
        .from('guests')
        .select('id')
        .eq('center_id', centerId);

      if (guestError) {
        console.error('Error getting guest count:', guestError);
        return;
      }

      const currentGuests = guests?.length || 0;

      // Get center to calculate available capacity
      const { data: center, error: centerError } = await supabase
        .from('rescue_centers')
        .select('total_capacity')
        .eq('id', centerId)
        .single();

      if (centerError) {
        console.error('Error getting center data:', centerError);
        return;
      }

      const availableCapacity = center.total_capacity - currentGuests;
      const status = currentGuests >= center.total_capacity ? 'full' : 'active';

      // Update center with new counts
      await supabase
        .from('rescue_centers')
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