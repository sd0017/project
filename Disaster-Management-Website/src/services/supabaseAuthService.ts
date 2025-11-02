import { supabase } from '../utils/supabase/client';
import { ENV } from '../utils/env';
import { supabaseDatabaseService, User } from './supabaseDatabaseService';

export interface AuthUser {
  id: string;
  email: string;
  role: 'citizen' | 'government' | 'rescue_center';
  employeeId?: string;
  centerId?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  role: 'citizen' | 'government' | 'rescue_center';
  employeeId?: string;
  centerId?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class SupabaseAuthService {
  // Sign up a new user
  async signUp(userData: SignUpData): Promise<AuthUser> {
    if (!ENV.isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    try {
      // Create the Supabase auth user with timeout
      const authPromise = supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Authentication timeout')), 10000)
      );

      const { data: authData, error: authError } = await Promise.race([
        authPromise,
        timeoutPromise
      ]) as any;

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create user profile in our users table
      try {
        const userProfile = await supabaseDatabaseService.createUser({
          email: userData.email,
          role: userData.role,
          employeeId: userData.employeeId,
          centerId: userData.centerId,
        });

        return {
          id: authData.user.id,
          email: userProfile.email,
          role: userProfile.role,
          employeeId: userProfile.employeeId,
          centerId: userProfile.centerId,
        };
      } catch (dbError) {
        // If user profile creation fails, clean up the auth user
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.warn('Failed to cleanup auth user:', cleanupError);
        }
        throw new Error(`Failed to create user profile: ${dbError}`);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in an existing user
  async signIn(credentials: SignInData): Promise<AuthUser> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Get user profile from our users table
      const userProfile = await supabaseDatabaseService.getUserByEmail(credentials.email);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      return {
        id: authData.user.id,
        email: userProfile.email,
        role: userProfile.role,
        employeeId: userProfile.employeeId,
        centerId: userProfile.centerId,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out the current user
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`Sign out error: ${error.message}`);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get the current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get current user error:', error);
        return null;
      }

      if (!user) {
        return null;
      }

      // Get user profile from our users table
      const userProfile = await supabaseDatabaseService.getUserByEmail(user.email!);
      
      if (!userProfile) {
        console.error('User profile not found for authenticated user');
        return null;
      }

      return {
        id: user.id,
        email: userProfile.email,
        role: userProfile.role,
        employeeId: userProfile.employeeId,
        centerId: userProfile.centerId,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userProfile = await supabaseDatabaseService.getUserByEmail(session.user.email!);
          if (userProfile) {
            callback({
              id: session.user.id,
              email: userProfile.email,
              role: userProfile.role,
              employeeId: userProfile.employeeId,
              centerId: userProfile.centerId,
            });
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error getting user profile on auth state change:', error);
          callback(null);
        }
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }

  // Check if current user has required role
  async hasRole(requiredRole: 'citizen' | 'government' | 'rescue_center'): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user?.role === requiredRole;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  // Check if current user can access a specific rescue center
  async canAccessCenter(centerId: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      // Government users can access all centers
      if (user.role === 'government') return true;

      // Rescue center users can only access their assigned center
      if (user.role === 'rescue_center') {
        return user.centerId === centerId;
      }

      // Citizens can view all centers (for finding shelter)
      if (user.role === 'citizen') return true;

      return false;
    } catch (error) {
      console.error('Error checking center access:', error);
      return false;
    }
  }

  // Validate employee ID for government users
  async validateEmployeeId(employeeId: string): Promise<boolean> {
    // In a real system, this would check against a government employee database
    // For now, we'll use a simple format validation
    const validPattern = /^GOV\d{3,}$/;
    return validPattern.test(employeeId);
  }

  // Validate center ID for rescue center users
  async validateCenterId(centerId: string): Promise<boolean> {
    try {
      const center = await supabaseDatabaseService.getCenterById(centerId);
      return center !== null;
    } catch (error) {
      console.error('Error validating center ID:', error);
      return false;
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(`Password reset error: ${error.message}`);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(`Password update error: ${error.message}`);
      }
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();