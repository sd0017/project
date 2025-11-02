import { supabaseAuthService, AuthUser, SignUpData, SignInData } from './supabaseAuthService';
import { ENV } from '../utils/env';

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'citizen' | 'government' | 'rescue_center';
  employeeId?: string;
  centerId?: string;
  profile?: any;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dob?: string;
  ageBracket?: string;
  mobile: string;
  street: string;
  village?: string;
  district: string;
  state: string;
  pincode: string;
  gpsConsent: boolean;
  disabilities?: string[];
  pregnantNursing?: boolean;
  chronicConditions?: string;
}

export class AuthService {
  // Try Supabase first, fallback to mock authentication
  private useSupabase = ENV.isSupabaseConfigured();

  // Mock user data for offline mode
  private getMockUsers(): any[] {
    const users = localStorage.getItem('mockUsers');
    return users ? JSON.parse(users) : [];
  }

  private saveMockUsers(users: any[]): void {
    localStorage.setItem('mockUsers', JSON.stringify(users));
  }

  private generateMockToken(user: User): string {
    return `mock_token_${user.id}_${Date.now()}`;
  }

  private createMockUser(userData: RegisterData): User {
    return {
      id: `user_${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'citizen',
      profile: userData
    };
  }

  private mapSupabaseUser(authUser: AuthUser): User {
    return {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      employeeId: authUser.employeeId,
      centerId: authUser.centerId
    };
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    if (this.useSupabase) {
      try {
        const authUser = await supabaseAuthService.signUp({
          email: userData.email,
          password: userData.password || 'defaultPassword123', // You might want to add password to RegisterData
          role: 'citizen',
        });
        
        const user = this.mapSupabaseUser(authUser);
        const token = `supabase_${authUser.id}`;
        this.setToken(token);
        
        return { token, user };
      } catch (error) {
        console.log('Supabase registration failed, falling back to offline mode');
        this.useSupabase = false;
      }
    }

    // Fallback to mock registration
    console.log('Using offline mode for registration');
    
    const users = this.getMockUsers();
    
    // Check if user already exists
    if (users.find(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }
    
    const newUser = this.createMockUser(userData);
    const token = this.generateMockToken(newUser);
    
    users.push(newUser);
    this.saveMockUsers(users);
    this.setToken(token);
    
    return { token, user: newUser };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    if (this.useSupabase) {
      try {
        const authUser = await supabaseAuthService.signIn({ email, password });
        const user = this.mapSupabaseUser(authUser);
        const token = `supabase_${authUser.id}`;
        this.setToken(token);
        
        return { token, user };
      } catch (error) {
        console.log('Supabase login failed, falling back to offline mode');
        this.useSupabase = false;
      }
    }

    // Fallback to mock login
    console.log('Using offline mode for login');
    
    const users = this.getMockUsers();
    const user = users.find(u => u.email === email);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // In mock mode, any password works (or you could store password)
    const token = this.generateMockToken(user);
    this.setToken(token);
    
    return { token, user };
  }

  async guestLogin(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/guest');
    if (response.token) {
      apiService.setToken(response.token);
    }
    return response;
  }

  async governmentLogin(employeeId: string, password: string): Promise<AuthResponse> {
    if (this.useSupabase) {
      try {
        // For government users, try to sign in with email format: employeeId@government.in
        const email = `${employeeId.toLowerCase()}@government.in`;
        const authUser = await supabaseAuthService.signIn({ email, password });
        
        if (authUser.role !== 'government') {
          throw new Error('Invalid government credentials');
        }
        
        const user = this.mapSupabaseUser(authUser);
        const token = `supabase_${authUser.id}`;
        this.setToken(token);
        
        return { token, user };
      } catch (error) {
        console.log('Supabase government login failed, falling back to offline mode');
        this.useSupabase = false;
      }
    }

    // Fallback to mock government login
    console.log('Using offline mode for government login');
    
    // Mock government user
    if (employeeId === 'GOV001' && password === 'password123') {
      const user: User = {
        id: 'gov_001',
        email: 'government@disaster.gov.in',
        role: 'government',
        employeeId: employeeId
      };
      const token = this.generateMockToken(user);
      this.setToken(token);
      return { token, user };
    }
    
    throw new Error('Invalid government credentials');
  }

  async rescueCenterLogin(centerId: string, password: string): Promise<AuthResponse> {
    if (this.useSupabase) {
      try {
        // For rescue center users, try to sign in with email format: centerId@rescue.center
        const email = `${centerId.toLowerCase()}@rescue.center`;
        const authUser = await supabaseAuthService.signIn({ email, password });
        
        if (authUser.role !== 'rescue_center' || authUser.centerId !== centerId) {
          throw new Error('Invalid rescue center credentials');
        }
        
        const user = this.mapSupabaseUser(authUser);
        const token = `supabase_${authUser.id}`;
        this.setToken(token);
        
        return { token, user };
      } catch (error) {
        console.log('Supabase rescue center login failed, falling back to offline mode');
        this.useSupabase = false;
      }
    }

    // Fallback to mock rescue center login
    console.log('Using offline mode for rescue center login');
    
    // Mock rescue center user
    if (centerId === 'RC001' && password === 'rescue123') {
      const user: User = {
        id: 'rc_001',
        email: 'center@rescue.gov.in',
        role: 'rescue_center',
        centerId: centerId
      };
      const token = this.generateMockToken(user);
      this.setToken(token);
      return { token, user };
    }
    
    throw new Error('Invalid rescue center credentials');
  }

  async getCurrentUser(): Promise<User> {
    if (this.useSupabase) {
      try {
        const authUser = await supabaseAuthService.getCurrentUser();
        if (authUser) {
          return this.mapSupabaseUser(authUser);
        }
      } catch (error) {
        console.log('Supabase getCurrentUser failed, falling back to offline mode');
        this.useSupabase = false;
      }
    }

    // Fallback to mock user from token
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('No valid session');
    }

    if (token.startsWith('supabase_')) {
      throw new Error('Supabase session expired');
    }

    if (!token.startsWith('mock_token_')) {
      throw new Error('Invalid token format');
    }
    
    // Extract user ID from mock token
    const userId = token.split('_')[2];
    const users = this.getMockUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      // Check for special accounts
      if (token.includes('gov_001')) {
        return {
          id: 'gov_001',
          email: 'government@disaster.gov.in',
          role: 'government',
          employeeId: 'GOV001'
        };
      } else if (token.includes('rc_001')) {
        return {
          id: 'rc_001',
          email: 'center@rescue.gov.in',
          role: 'rescue_center',
          centerId: 'RC001'
        };
      }
      throw new Error('User not found');
    }
    
    return user;
  }

  async logout(): Promise<void> {
    if (this.useSupabase) {
      try {
        await supabaseAuthService.signOut();
      } catch (error) {
        console.log('Supabase logout failed');
      }
    }

    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

export const authService = new AuthService();