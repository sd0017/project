import { createClient } from '@supabase/supabase-js';
import { ENV } from '../env';

// Create Supabase client with safe defaults
export const supabase = createClient(
  ENV.SUPABASE_URL, 
  ENV.SUPABASE_ANON_KEY, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Export configuration status
export const isSupabaseConfigured = ENV.isSupabaseConfigured();

// Database types for Supabase (keeping the existing interface)

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      rescue_centers: {
        Row: {
          id: string;
          name: string;
          lat: number;
          lng: number;
          total_capacity: number;
          current_guests: number;
          available_capacity: number;
          water_level: number;
          food_level: number;
          phone: string;
          address: string;
          facilities: string[];
          status: 'active' | 'inactive' | 'full';
          last_updated: string;
          emergency_contacts: any;
          supplies: any;
          staff_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          lat: number;
          lng: number;
          total_capacity: number;
          current_guests?: number;
          available_capacity?: number;
          water_level: number;
          food_level: number;
          phone: string;
          address: string;
          facilities: string[];
          status?: 'active' | 'inactive' | 'full';
          last_updated?: string;
          emergency_contacts: any;
          supplies: any;
          staff_count: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          lat?: number;
          lng?: number;
          total_capacity?: number;
          current_guests?: number;
          available_capacity?: number;
          water_level?: number;
          food_level?: number;
          phone?: string;
          address?: string;
          facilities?: string[];
          status?: 'active' | 'inactive' | 'full';
          last_updated?: string;
          emergency_contacts?: any;
          supplies?: any;
          staff_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      guests: {
        Row: {
          id: string;
          first_name: string;
          middle_name?: string;
          last_name: string;
          gender: string;
          date_of_birth?: string;
          age?: string;
          mobile_phone: string;
          alternate_mobile?: string;
          email?: string;
          permanent_address?: string;
          family_members?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          dependents?: string;
          medical_conditions?: string;
          current_medications?: string;
          allergies?: string;
          disability_status?: string;
          special_needs?: string;
          center_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          middle_name?: string;
          last_name: string;
          gender: string;
          date_of_birth?: string;
          age?: string;
          mobile_phone: string;
          alternate_mobile?: string;
          email?: string;
          permanent_address?: string;
          family_members?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          dependents?: string;
          medical_conditions?: string;
          current_medications?: string;
          allergies?: string;
          disability_status?: string;
          special_needs?: string;
          center_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          middle_name?: string;
          last_name?: string;
          gender?: string;
          date_of_birth?: string;
          age?: string;
          mobile_phone?: string;
          alternate_mobile?: string;
          email?: string;
          permanent_address?: string;
          family_members?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          dependents?: string;
          medical_conditions?: string;
          current_medications?: string;
          allergies?: string;
          disability_status?: string;
          special_needs?: string;
          center_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: 'citizen' | 'government' | 'rescue_center';
          employee_id?: string;
          center_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: 'citizen' | 'government' | 'rescue_center';
          employee_id?: string;
          center_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'citizen' | 'government' | 'rescue_center';
          employee_id?: string;
          center_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}