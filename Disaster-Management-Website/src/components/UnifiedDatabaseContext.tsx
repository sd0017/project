import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseDatabaseService, RescueCenter as SupabaseRescueCenter, Guest as SupabaseGuest, DisasterStats as SupabaseDisasterStats } from '../services/supabaseDatabaseService';
import { notificationService } from '../services/notificationService';

// Re-export types from Supabase service for consistency
export type RescueCenter = SupabaseRescueCenter;
export type Guest = SupabaseGuest;
export type DisasterStats = SupabaseDisasterStats;

// Types and interfaces moved to httpDatabaseService

interface UnifiedDatabaseContextType {
  // Rescue Center operations
  rescueCenters: RescueCenter[];
  getRescueCenters: () => Promise<RescueCenter[]>;
  getRescueCenterById: (id: string) => Promise<RescueCenter | null>;
  updateRescueCenter: (id: string, updates: Partial<RescueCenter>) => Promise<RescueCenter>;
  addRescueCenter: (centerData: Omit<RescueCenter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RescueCenter>;
  deleteRescueCenter: (id: string) => Promise<void>;
  
  // Guest operations (enhanced from DatabaseContext)
  guests: Guest[];
  getGuestsByCenter: (centerId: string) => Promise<Guest[]>;
  getAllGuests: () => Promise<Guest[]>;
  getGuestById: (id: string) => Promise<Guest | null>;
  addGuest: (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Guest>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<Guest>;
  deleteGuest: (id: string) => Promise<void>;
  
  // Cross-platform sync operations
  syncCenterCapacity: (centerId: string) => Promise<void>;
  getDisasterStats: () => Promise<DisasterStats>;
  searchGuests: (query: string) => Promise<Guest[]>;
  
  // Real-time updates
  loading: boolean;
  lastSyncTime: string | null;
  refreshData: () => Promise<void>;
}

const UnifiedDatabaseContext = createContext<UnifiedDatabaseContextType | undefined>(undefined);

export const useUnifiedDatabase = () => {
  const context = useContext(UnifiedDatabaseContext);
  if (!context) {
    throw new Error('useUnifiedDatabase must be used within a UnifiedDatabaseProvider');
  }
  return context;
};

// Supabase-powered unified database provider with offline fallback

export const UnifiedDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rescueCenters, setRescueCenters] = useState<RescueCenter[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Initialize data from offline storage first
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.error('Data initialization timed out');
      setLoading(false);
    }, 3000); // 3 second timeout

    initializeData().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      console.log('Initializing with Supabase backend');
      
      // Load offline data first for immediate UI
      loadFallbackData();
      
      // Try to load data from Supabase in the background
      try {
        // Add a timeout to prevent hanging
        const supabasePromise = Promise.all([
          supabaseDatabaseService.getAllCenters(),
          supabaseDatabaseService.getAllGuests()
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase initialization timeout')), 8000)
        );
        
        const [centersFromSupabase, guestsFromSupabase] = await Promise.race([
          supabasePromise,
          timeoutPromise
        ]) as [any[], any[]];
        
        console.log('Successfully loaded data from Supabase');
        setRescueCenters(centersFromSupabase);
        setGuests(guestsFromSupabase);
        setLastSyncTime(new Date().toISOString());
        
        // Save to localStorage for offline access
        localStorage.setItem('unifiedRescueCenters', JSON.stringify(centersFromSupabase));
        localStorage.setItem('unifiedGuests', JSON.stringify(guestsFromSupabase));
        
      } catch (supabaseError) {
        console.log('Supabase unavailable during initialization, using offline data:', supabaseError);
        // Fallback data is already loaded above
      }
    } catch (error) {
      console.error('Error during data initialization:', error);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    try {
      // Fallback to demo data if Supabase is not available
      const demoCenters: RescueCenter[] = [
        {
          id: 'RC001',
          name: 'Central Emergency Shelter',
          lat: 12.9716,
          lng: 77.5946,
          totalCapacity: 500,
          currentGuests: 0,
          availableCapacity: 500,
          waterLevel: 85,
          foodLevel: 70,
          phone: '+91-80-2345-6789',
          address: 'MG Road, Bangalore, Karnataka 560001',
          facilities: ['Medical Aid', 'Sanitation', 'Power Backup', 'Communication', 'Kitchen'],
          status: 'active',
          lastUpdated: new Date().toISOString(),
          emergencyContacts: {
            primary: '+91-80-2345-6789',
            secondary: '+91-80-2345-6790'
          },
          supplies: {
            medical: 80,
            bedding: 75,
            clothing: 60
          },
          staffCount: 25,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'RC002',
          name: 'North Zone Emergency Hub',
          lat: 12.9916,
          lng: 77.6146,
          totalCapacity: 300,
          currentGuests: 0,
          availableCapacity: 300,
          waterLevel: 95,
          foodLevel: 60,
          phone: '+91-80-2345-6791',
          address: 'Hebbal Main Road, Bangalore, Karnataka 560024',
          facilities: ['Medical Aid', 'Sanitation', 'Kitchen', 'Children Area'],
          status: 'active',
          lastUpdated: new Date().toISOString(),
          emergencyContacts: {
            primary: '+91-80-2345-6791'
          },
          supplies: {
            medical: 90,
            bedding: 85,
            clothing: 70
          },
          staffCount: 18,
          createdAt: '2024-01-20T09:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'RC003',
          name: 'South District Relief Center',
          lat: 12.9516,
          lng: 77.5746,
          totalCapacity: 400,
          currentGuests: 0,
          availableCapacity: 400,
          waterLevel: 40,
          foodLevel: 30,
          phone: '+91-80-2345-6792',
          address: '4th Block, Jayanagar, Bangalore, Karnataka 560011',
          facilities: ['Medical Aid', 'Sanitation', 'Power Backup'],
          status: 'active',
          lastUpdated: new Date().toISOString(),
          emergencyContacts: {
            primary: '+91-80-2345-6792',
            secondary: '+91-80-2345-6793'
          },
          supplies: {
            medical: 45,
            bedding: 30,
            clothing: 25
          },
          staffCount: 20,
          createdAt: '2024-01-18T14:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'RC004',
          name: 'East Emergency Hub',
          lat: 12.9816,
          lng: 77.6346,
          totalCapacity: 250,
          currentGuests: 0,
          availableCapacity: 250,
          waterLevel: 75,
          foodLevel: 80,
          phone: '+91-80-2345-6794',
          address: 'ITPL Main Road, Whitefield, Bangalore, Karnataka 560066',
          facilities: ['Medical Aid', 'Kitchen', 'Communication', 'WiFi'],
          status: 'active',
          lastUpdated: new Date().toISOString(),
          emergencyContacts: {
            primary: '+91-80-2345-6794'
          },
          supplies: {
            medical: 85,
            bedding: 90,
            clothing: 80
          },
          staffCount: 15,
          createdAt: '2024-01-22T11:00:00Z',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'RC005',
          name: 'West Relief Station',
          lat: 12.9616,
          lng: 77.5546,
          totalCapacity: 350,
          currentGuests: 0,
          availableCapacity: 350,
          waterLevel: 65,
          foodLevel: 75,
          phone: '+91-80-2345-6795',
          address: 'Dr. Rajkumar Road, Rajajinagar, Bangalore, Karnataka 560010',
          facilities: ['Medical Aid', 'Sanitation', 'Power Backup', 'Kitchen', 'Pharmacy'],
          status: 'active',
          lastUpdated: new Date().toISOString(),
          emergencyContacts: {
            primary: '+91-80-2345-6795',
            secondary: '+91-80-2345-6796'
          },
          supplies: {
            medical: 70,
            bedding: 65,
            clothing: 55
          },
          staffCount: 22,
          createdAt: '2024-01-25T08:00:00Z',
          updatedAt: new Date().toISOString()
        }
      ];

      // Load guests and centers from localStorage if available, otherwise use demo data
      const savedGuests = localStorage.getItem('unifiedGuests');
      const savedCenters = localStorage.getItem('unifiedRescueCenters');
      
      let guestData: Guest[] = [];
      
      if (savedGuests) {
        try {
          guestData = JSON.parse(savedGuests);
          setGuests(guestData);
        } catch (error) {
          console.error('Error parsing saved guests:', error);
          localStorage.removeItem('unifiedGuests');
        }
      }
      
      if (savedCenters) {
        try {
          // Use saved centers (which should already have updated counts)
          const centersData = JSON.parse(savedCenters);
          setRescueCenters(centersData);
        } catch (error) {
          console.error('Error parsing saved centers:', error);
          localStorage.removeItem('unifiedRescueCenters');
          // Fall back to demo centers
          const updatedDemoCenters = demoCenters.map(center => {
            const centerGuests = guestData.filter((guest: Guest) => guest.centerId === center.id);
            return {
              ...center,
              currentGuests: centerGuests.length,
              availableCapacity: center.totalCapacity - centerGuests.length,
              status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
            };
          });
          setRescueCenters(updatedDemoCenters);
          localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedDemoCenters));
        }
      } else {
        // Initialize with demo centers and sync with guest counts
        const updatedDemoCenters = demoCenters.map(center => {
          const centerGuests = guestData.filter((guest: Guest) => guest.centerId === center.id);
          return {
            ...center,
            currentGuests: centerGuests.length,
            availableCapacity: center.totalCapacity - centerGuests.length,
            status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
          };
        });
        setRescueCenters(updatedDemoCenters);
        localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedDemoCenters));
      }
      
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error loading fallback data:', error);
      // Set minimal fallback state
      setRescueCenters([]);
      setGuests([]);
      setLastSyncTime(new Date().toISOString());
    }
  };

  const generateGuestId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `GUEST${timestamp}${random}`;
  };

  // Rescue Center operations
  const getRescueCenters = async (): Promise<RescueCenter[]> => {
    try {
      // Try to get fresh data from Supabase
      const centersFromSupabase = await supabaseDatabaseService.getAllCenters();
      setRescueCenters(centersFromSupabase);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(centersFromSupabase));
      setLastSyncTime(new Date().toISOString());
      return centersFromSupabase;
    } catch (error) {
      console.log('Supabase unavailable, using cached rescue centers');
      return rescueCenters;
    }
  };

  const getRescueCenterById = async (id: string): Promise<RescueCenter | null> => {
    try {
      return await supabaseDatabaseService.getCenterById(id);
    } catch (error) {
      console.error('Supabase unavailable for getCenterById:', error);
      return rescueCenters.find(center => center.id === id) || null;
    }
  };

  const updateRescueCenter = async (id: string, updates: Partial<RescueCenter>): Promise<RescueCenter> => {
    setLoading(true);
    try {
      // Try to update via Supabase first
      const updatedCenter = await supabaseDatabaseService.updateCenter(id, updates);
      
      // Update local state with Supabase response
      const updatedCenters = rescueCenters.map(center =>
        center.id === id ? updatedCenter : center
      );
      
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      setLastSyncTime(new Date().toISOString());
      
      return updatedCenter;
    } catch (error) {
      console.log('Supabase unavailable, updating center locally');
      
      // Fallback to local update
      const updatedCenters = rescueCenters.map(center =>
        center.id === id
          ? { ...center, ...updates, updatedAt: new Date().toISOString() }
          : center
      );
      
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      const updatedCenter = updatedCenters.find(center => center.id === id);
      if (!updatedCenter) {
        throw new Error('Center not found');
      }
      
      setLastSyncTime(new Date().toISOString());
      return updatedCenter;
    } finally {
      setLoading(false);
    }
  };

  const addRescueCenter = async (centerData: Omit<RescueCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<RescueCenter> => {
    setLoading(true);
    try {
      // Try to create via Supabase first
      const newCenter = await supabaseDatabaseService.createCenter(centerData);
      
      // Update local state
      const updatedCenters = [...rescueCenters, newCenter];
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      setLastSyncTime(new Date().toISOString());
      return newCenter;
    } catch (error) {
      console.log('Supabase unavailable, creating center locally');
      
      // Fallback to local creation
      const newCenter: RescueCenter = {
        ...centerData,
        id: `RC${String(rescueCenters.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedCenters = [...rescueCenters, newCenter];
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      setLastSyncTime(new Date().toISOString());
      return newCenter;
    } finally {
      setLoading(false);
    }
  };

  const deleteRescueCenter = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      // Try to delete via Supabase first (this will also delete associated guests)
      await supabaseDatabaseService.deleteCenter(id);
      
      // Update local state
      const updatedCenters = rescueCenters.filter(center => center.id !== id);
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      // Also remove guests from deleted center locally
      const updatedGuests = guests.filter(guest => guest.centerId !== id);
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));
      
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.log('Supabase unavailable, deleting center locally');
      
      // Fallback to local deletion
      const updatedCenters = rescueCenters.filter(center => center.id !== id);
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      // Also remove guests from deleted center
      const updatedGuests = guests.filter(guest => guest.centerId !== id);
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));
      
      setLastSyncTime(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  // Guest operations
  const getGuestsByCenter = async (centerId: string): Promise<Guest[]> => {
    try {
      const supabaseGuests = await supabaseDatabaseService.getGuestsByCenter(centerId);
      return supabaseGuests;
    } catch (error) {
      console.log('Supabase unavailable, using local guest data for center:', centerId);
      return guests.filter(guest => guest.centerId === centerId);
    }
  };

  const getAllGuests = async (): Promise<Guest[]> => {
    try {
      const supabaseGuests = await supabaseDatabaseService.getAllGuests();
      setGuests(supabaseGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(supabaseGuests));
      setLastSyncTime(new Date().toISOString());
      return supabaseGuests;
    } catch (error) {
      console.log('Supabase unavailable for getAllGuests, using local data');
      
      // Return cached guests if available
      if (guests.length > 0) {
        return guests;
      }
      
      // Try to load from localStorage as fallback
      try {
        const localGuests = localStorage.getItem('unifiedGuests');
        if (localGuests) {
          const parsedGuests = JSON.parse(localGuests);
          setGuests(parsedGuests);
          return parsedGuests;
        }
      } catch (parseError) {
        console.error('Error parsing local guests:', parseError);
      }
      
      return []; // Return empty array if no data available
    }
  };

  const getGuestById = async (id: string): Promise<Guest | null> => {
    try {
      return await supabaseDatabaseService.getGuestById(id);
    } catch (error) {
      console.log('Supabase unavailable, using local guest data for ID:', id);
      return guests.find(guest => guest.id === id) || null;
    }
  };

  const addGuest = async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> => {
    setLoading(true);
    try {
      // Try to create via Supabase first (this will automatically update center capacity)
      const newGuest = await supabaseDatabaseService.createGuest(guestData);
      
      // Update local state
      const updatedGuests = [...guests, newGuest];
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));

      // Refresh center data from Supabase to get updated capacity
      try {
        const updatedCenter = await supabaseDatabaseService.getCenterById(guestData.centerId);
        if (updatedCenter) {
          const updatedCenters = rescueCenters.map(center =>
            center.id === guestData.centerId ? updatedCenter : center
          );
          setRescueCenters(updatedCenters);
          localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
        }
      } catch (centerError) {
        // If can't get updated center, fall back to local calculation
        const centerGuests = updatedGuests.filter(guest => guest.centerId === guestData.centerId);
        const updatedCenters = rescueCenters.map(center =>
          center.id === guestData.centerId
            ? {
                ...center,
                currentGuests: centerGuests.length,
                availableCapacity: center.totalCapacity - centerGuests.length,
                status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : center
        );
        setRescueCenters(updatedCenters);
        localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      }
      
      setLastSyncTime(new Date().toISOString());
      return newGuest;
    } catch (error) {
      console.log('Supabase unavailable, creating guest locally');
      
      // Fallback to local creation
      const newGuest: Guest = {
        ...guestData,
        id: generateGuestId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedGuests = [...guests, newGuest];
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));

      // Update center capacity with the new guest count
      const centerGuests = updatedGuests.filter(guest => guest.centerId === guestData.centerId);
      const updatedCenters = rescueCenters.map(center =>
        center.id === guestData.centerId
          ? {
              ...center,
              currentGuests: centerGuests.length,
              availableCapacity: center.totalCapacity - centerGuests.length,
              status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : center
      );
      
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      
      setLastSyncTime(new Date().toISOString());
      return newGuest;
    } finally {
      setLoading(false);
    }
  };

  const updateGuest = async (id: string, updates: Partial<Guest>): Promise<Guest> => {
    setLoading(true);
    try {
      // Try to update via Supabase first
      const updatedGuest = await supabaseDatabaseService.updateGuest(id, updates);
      
      // Update local state
      const updatedGuests = guests.map(guest =>
        guest.id === id ? updatedGuest : guest
      );
      
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));
      
      setLastSyncTime(new Date().toISOString());
      return updatedGuest;
    } catch (error) {
      console.log('Supabase unavailable, updating guest locally');
      
      // Fallback to local update
      const updatedGuests = guests.map(guest =>
        guest.id === id
          ? { ...guest, ...updates, updatedAt: new Date().toISOString() }
          : guest
      );
      
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));
      
      const updatedGuest = updatedGuests.find(guest => guest.id === id);
      if (!updatedGuest) {
        throw new Error('Guest not found');
      }
      
      setLastSyncTime(new Date().toISOString());
      return updatedGuest;
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const guestToDelete = guests.find(guest => guest.id === id);
      if (!guestToDelete) {
        throw new Error('Guest not found');
      }

      // Try to delete via Supabase first (this will automatically update center capacity)
      await supabaseDatabaseService.deleteGuest(id);
      
      // Update local state
      const updatedGuests = guests.filter(guest => guest.id !== id);
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));

      // Refresh center data from Supabase to get updated capacity
      try {
        const updatedCenter = await supabaseDatabaseService.getCenterById(guestToDelete.centerId);
        if (updatedCenter) {
          const updatedCenters = rescueCenters.map(center =>
            center.id === guestToDelete.centerId ? updatedCenter : center
          );
          setRescueCenters(updatedCenters);
          localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
        }
      } catch (centerError) {
        // If can't get updated center, fall back to local calculation
        const centerGuests = updatedGuests.filter(guest => guest.centerId === guestToDelete.centerId);
        const updatedCenters = rescueCenters.map(center =>
          center.id === guestToDelete.centerId
            ? {
                ...center,
                currentGuests: centerGuests.length,
                availableCapacity: center.totalCapacity - centerGuests.length,
                status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : center
        );
        setRescueCenters(updatedCenters);
        localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      }
      
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.log('Supabase unavailable, deleting guest locally');
      
      // Fallback to local deletion
      const guestToDelete = guests.find(guest => guest.id === id);
      const updatedGuests = guests.filter(guest => guest.id !== id);
      setGuests(updatedGuests);
      localStorage.setItem('unifiedGuests', JSON.stringify(updatedGuests));

      // Update center capacity with the new guest count
      if (guestToDelete) {
        const centerGuests = updatedGuests.filter(guest => guest.centerId === guestToDelete.centerId);
        const updatedCenters = rescueCenters.map(center =>
          center.id === guestToDelete.centerId
            ? {
                ...center,
                currentGuests: centerGuests.length,
                availableCapacity: center.totalCapacity - centerGuests.length,
                status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
                lastUpdated: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : center
        );
        setRescueCenters(updatedCenters);
        localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
      }
      
      setLastSyncTime(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  // Cross-platform sync operations
  const syncCenterCapacity = useCallback(async (centerId: string): Promise<void> => {
    try {
      const centerGuests = guests.filter(guest => guest.centerId === centerId);
      const updatedCenters = rescueCenters.map(center =>
        center.id === centerId
          ? {
              ...center,
              currentGuests: centerGuests.length,
              availableCapacity: center.totalCapacity - centerGuests.length,
              status: centerGuests.length >= center.totalCapacity ? 'full' as const : 'active' as const,
              lastUpdated: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          : center
      );
      
      setRescueCenters(updatedCenters);
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(updatedCenters));
    } catch (error) {
      console.error('Error syncing center capacity:', error);
    }
  }, [guests, rescueCenters]);

  const getDisasterStats = async (): Promise<DisasterStats> => {
    try {
      return await supabaseDatabaseService.getDisasterStats();
    } catch (error) {
      console.log('Supabase unavailable, calculating stats locally');
      
      // Fallback to local calculation
      const totalCenters = rescueCenters.length;
      const totalCapacity = rescueCenters.reduce((sum, center) => sum + center.totalCapacity, 0);
      const totalOccupancy = rescueCenters.reduce((sum, center) => sum + center.currentGuests, 0);
      const availableSpace = totalCapacity - totalOccupancy;
      
      const centersWithCriticalSupplies = rescueCenters.filter(center => 
        center.waterLevel < 30 || center.foodLevel < 30 || 
        center.supplies.medical < 30
      ).length;
      
      const recentlyUpdatedCenters = rescueCenters.filter(center => {
        const lastUpdated = new Date(center.lastUpdated);
        const now = new Date();
        const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        return diffInHours <= 2;
      }).length;
      
      const averageOccupancyRate = totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0;

      return {
        totalCenters,
        totalCapacity,
        totalOccupancy,
        availableSpace,
        centersWithCriticalSupplies,
        recentlyUpdatedCenters,
        averageOccupancyRate
      };
    }
  };

  const searchGuests = async (query: string): Promise<Guest[]> => {
    try {
      return await supabaseDatabaseService.searchGuests(query);
    } catch (error) {
      console.log('Supabase unavailable, searching guests locally');
      
      // Fallback to local search
      const searchTerm = query.toLowerCase();
      return guests.filter(guest =>
        guest.firstName.toLowerCase().includes(searchTerm) ||
        guest.lastName.toLowerCase().includes(searchTerm) ||
        guest.mobilePhone.includes(searchTerm) ||
        guest.id.toLowerCase().includes(searchTerm) ||
        (guest.email && guest.email.toLowerCase().includes(searchTerm))
      );
    }
  };

  const refreshData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // Try to fetch fresh data from Supabase
      const [freshCenters, freshGuests] = await Promise.all([
        supabaseDatabaseService.getAllCenters(),
        supabaseDatabaseService.getAllGuests()
      ]);
      
      setRescueCenters(freshCenters);
      setGuests(freshGuests);
      
      // Update localStorage
      localStorage.setItem('unifiedRescueCenters', JSON.stringify(freshCenters));
      localStorage.setItem('unifiedGuests', JSON.stringify(freshGuests));
      
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.log('Supabase unavailable, keeping current data to prevent reset');
      // In offline mode, don't reload from localStorage as it might overwrite current state
      // Just update the last sync time to indicate we attempted a refresh
      setLastSyncTime(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UnifiedDatabaseContext.Provider
      value={{
        rescueCenters,
        getRescueCenters,
        getRescueCenterById,
        updateRescueCenter,
        addRescueCenter,
        deleteRescueCenter,
        guests,
        getGuestsByCenter,
        getAllGuests,
        getGuestById,
        addGuest,
        updateGuest,
        deleteGuest,
        syncCenterCapacity,
        getDisasterStats,
        searchGuests,
        loading,
        lastSyncTime,
        refreshData
      }}
    >
      {children}
    </UnifiedDatabaseContext.Provider>
  );
};