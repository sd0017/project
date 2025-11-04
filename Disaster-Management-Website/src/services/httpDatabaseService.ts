import { backendApiService } from './backendApiService';
import { mongoService } from './mongoService';

import { ObjectId } from 'mongodb';

// Base interface for documents
interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend interfaces aligned with database types
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

// Map API response to local interface
const mapApiCenterToLocal = (apiCenter: any): RescueCenter => {
  return {
    _id: apiCenter.id ? new ObjectId(apiCenter.id) : undefined,
    name: apiCenter.name,
    location: {
      type: 'Point',
      coordinates: [apiCenter.longitude || 0, apiCenter.latitude || 0]
    },
    totalCapacity: apiCenter.capacity,
    currentGuests: apiCenter.current_occupancy || 0,
    availableCapacity: apiCenter.capacity - (apiCenter.current_occupancy || 0),
    resources: {
      water: apiCenter.resources?.water || 0,
      food: apiCenter.resources?.food || 0,
      medical: apiCenter.resources?.medicine || 0,
      bedding: apiCenter.resources?.blankets || 0,
      clothing: apiCenter.resources?.clothing || 0,
    },
    contact: {
      phone: apiCenter.contact_number,
      emergency: {
        primary: apiCenter.emergency_contact || apiCenter.contact_number,
        secondary: apiCenter.secondary_contact
      }
    },
    address: apiCenter.address,
    facilities: apiCenter.facilities || [],
    status: apiCenter.status || 'active',
    staffCount: apiCenter.staff_count || 20,
    lastUpdated: new Date(apiCenter.last_updated),
    createdAt: new Date(apiCenter.created_at || apiCenter.last_updated),
    updatedAt: new Date(apiCenter.updated_at || apiCenter.last_updated)
  };
};

export class HttpDatabaseService {
  // Helper methods for guest mapping
  private mapApiGuestToLocal(apiGuest: any): Guest {
    return {
      _id: apiGuest._id ? new ObjectId(apiGuest._id) : new ObjectId(),
      personalInfo: {
        firstName: apiGuest.firstName || '',
        lastName: apiGuest.lastName || '',
        gender: apiGuest.gender,
        dateOfBirth: apiGuest.dateOfBirth ? new Date(apiGuest.dateOfBirth) : undefined,
        age: apiGuest.age,
        aadharNumber: apiGuest.aadharNumber
      },
      contact: {
        phone: apiGuest.phone || apiGuest.mobilePhone,
        alternatePhone: apiGuest.alternatePhone || apiGuest.alternateMobile,
        email: apiGuest.email,
        address: apiGuest.address || apiGuest.permanentAddress
      },
      emergency: {
        contactName: apiGuest.emergencyContactName,
        contactPhone: apiGuest.emergencyContactPhone,
        relation: apiGuest.emergencyContactRelation
      },
      medical: {
        conditions: apiGuest.medicalConditions ? [apiGuest.medicalConditions] : undefined,
        medications: apiGuest.currentMedications ? [apiGuest.currentMedications] : undefined,
        allergies: apiGuest.allergies ? [apiGuest.allergies] : undefined,
        specialNeeds: apiGuest.specialNeeds
      },
      stay: {
        centerId: new ObjectId(apiGuest.centerId),
        status: 'admitted',
        admittedAt: apiGuest.createdAt ? new Date(apiGuest.createdAt) : new Date()
      },
      family: {
        members: apiGuest.familyMembers ? [apiGuest.familyMembers] : undefined
      },
      createdAt: apiGuest.createdAt ? new Date(apiGuest.createdAt) : new Date(),
      updatedAt: apiGuest.updatedAt ? new Date(apiGuest.updatedAt) : new Date()
    };
  }

  private mapLocalGuestToApi(guest: Partial<Guest>): any {
    const apiGuest: any = {};

    if (guest.personalInfo) {
      apiGuest.firstName = guest.personalInfo.firstName;
      apiGuest.lastName = guest.personalInfo.lastName;
      apiGuest.gender = guest.personalInfo.gender;
      apiGuest.dateOfBirth = guest.personalInfo.dateOfBirth?.toISOString();
      apiGuest.age = guest.personalInfo.age;
      apiGuest.aadharNumber = guest.personalInfo.aadharNumber;
    }

    if (guest.contact) {
      apiGuest.phone = guest.contact.phone;
      apiGuest.alternatePhone = guest.contact.alternatePhone;
      apiGuest.email = guest.contact.email;
      apiGuest.address = guest.contact.address;
    }

    if (guest.emergency) {
      apiGuest.emergencyContactName = guest.emergency.contactName;
      apiGuest.emergencyContactPhone = guest.emergency.contactPhone;
      apiGuest.emergencyContactRelation = guest.emergency.relation;
    }

    if (guest.medical) {
      apiGuest.medicalConditions = guest.medical.conditions?.join(', ');
      apiGuest.currentMedications = guest.medical.medications?.join(', ');
      apiGuest.allergies = guest.medical.allergies?.join(', ');
      apiGuest.specialNeeds = guest.medical.specialNeeds;
    }

    if (guest.stay) {
      apiGuest.centerId = guest.stay.centerId.toString();
      apiGuest.status = guest.stay.status;
      apiGuest.admittedAt = guest.stay.admittedAt?.toISOString();
      if (guest.stay.dischargedAt) {
        apiGuest.dischargedAt = guest.stay.dischargedAt.toISOString();
      }
      if (guest.stay.transferredTo) {
        apiGuest.transferredTo = guest.stay.transferredTo.toString();
      }
    }

    if (guest.family) {
      apiGuest.familyMembers = guest.family.members?.join(', ');
      apiGuest.familySize = guest.family.size;
    }

    return apiGuest;
  }

  // Guest operations
  // Rescue Center operations
  async getAllCenters(): Promise<RescueCenter[]> {
    // Try MongoDB first if available
    if (mongoService.isMongoAvailable()) {
      try {
        const mongoCenters = await mongoService.getAllCenters();
        return mongoCenters;
      } catch (error) {
        console.log('MongoDB query failed, trying HTTP API');
      }
    }

    // Fallback to HTTP API
    try {
      const apiCenters = await backendApiService.get<any[]>('/centers');
      return apiCenters.map(mapApiCenterToLocal);
    } catch (error) {
      console.log('HTTP API unavailable, using mock data for centers');
      return this.getMockCenters();
    }
  }

  async getCenterById(id: string): Promise<RescueCenter | null> {
    try {
      const apiCenter = await backendApiService.get<any>(`/centers/${id}`);
      return mapApiCenterToLocal(apiCenter);
    } catch (error) {
      console.log('API unavailable, using mock data for center:', id);
      const mockCenters = this.getMockCenters();
      return mockCenters.find(center => center._id?.toString() === id) || null;
    }
  }

  async createCenter(centerData: Omit<RescueCenter, '_id' | 'createdAt' | 'updatedAt'>): Promise<RescueCenter> {
    try {
      // Map to API format
      const apiData = {
        name: centerData.name,
        location: centerData.location,
        totalCapacity: centerData.totalCapacity,
        currentGuests: 0,
        availableCapacity: centerData.totalCapacity,
        resources: centerData.resources,
        contact: centerData.contact,
        address: centerData.address,
        facilities: centerData.facilities,
        status: centerData.status,
        staffCount: centerData.staffCount
      };

      const apiCenter = await backendApiService.post<any>('/centers', apiData);
      return mapApiCenterToLocal(apiCenter);
    } catch (error) {
      console.log('API unavailable, center creation will be stored locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  async updateCenter(id: string, updates: Partial<RescueCenter>): Promise<RescueCenter> {
    try {
      // Map to API format for updates
      const apiUpdates: any = {};
      
      if (updates.name) apiUpdates.name = updates.name;
      if (updates.location) apiUpdates.location = updates.location;
      if (updates.totalCapacity) apiUpdates.totalCapacity = updates.totalCapacity;
      if (updates.currentGuests !== undefined) {
        apiUpdates.currentGuests = updates.currentGuests;
        apiUpdates.availableCapacity = updates.totalCapacity 
          ? updates.totalCapacity - updates.currentGuests 
          : undefined;
      }
      if (updates.resources) apiUpdates.resources = updates.resources;
      if (updates.contact) apiUpdates.contact = updates.contact;
      if (updates.address) apiUpdates.address = updates.address;
      if (updates.facilities) apiUpdates.facilities = updates.facilities;
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.staffCount) apiUpdates.staffCount = updates.staffCount;

      const apiCenter = await backendApiService.put<any>(`/centers/${id}`, apiUpdates);
      return mapApiCenterToLocal(apiCenter);
    } catch (error) {
      console.log('API unavailable, center update will be stored locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  async deleteCenter(id: string): Promise<void> {
    try {
      await backendApiService.delete(`/centers/${id}`);
    } catch (error) {
      console.log('API unavailable, center deletion will be handled locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  // Guest operations
  async getAllGuests(): Promise<Guest[]> {
    try {
      return await backendApiService.get<Guest[]>('/guests');
    } catch (error) {
      console.log('API unavailable, using local guest data');
      return [];
    }
  }

  async getGuestsByCenter(centerId: string): Promise<Guest[]> {
    try {
      return await backendApiService.get<Guest[]>(`/guests?centerId=${centerId}`);
    } catch (error) {
      console.log('API unavailable, using local guest data for center:', centerId);
      return [];
    }
  }

  async getGuestById(id: string): Promise<Guest | null> {
    try {
      return await backendApiService.get<Guest>(`/guests/${id}`);
    } catch (error) {
      console.log('API unavailable, using local guest data for ID:', id);
      return null;
    }
  }

  async createGuest(guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    try {
      return await backendApiService.post<Guest>('/guests', guestData);
    } catch (error) {
      console.log('API unavailable, guest creation will be stored locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    try {
      return await backendApiService.put<Guest>(`/guests/${id}`, updates);
    } catch (error) {
      console.log('API unavailable, guest update will be stored locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  async deleteGuest(id: string): Promise<void> {
    try {
      await backendApiService.delete(`/guests/${id}`);
    } catch (error) {
      console.log('API unavailable, guest deletion will be handled locally');
      throw new Error('API_UNAVAILABLE');
    }
  }

  async searchGuests(query: string): Promise<Guest[]> {
    try {
      return await backendApiService.get<Guest[]>(`/guests?search=${encodeURIComponent(query)}`);
    } catch (error) {
      console.log('API unavailable, using local guest search');
      return [];
    }
  }

  // Statistics
  async getDisasterStats(): Promise<DisasterStats> {
    try {
      return await backendApiService.get<DisasterStats>('/stats/disaster');
    } catch (error) {
      console.log('API unavailable, using mock disaster statistics');
      // Return mock stats as fallback
      return {
        _id: new ObjectId(),
        totalCenters: 5,
        totalGuests: 0,
        availableCapacity: 1800,
        occupancyRate: 0,
        resourceStatus: {
          water: 75,
          food: 80,
          medical: 70
        },
        criticalCenters: 1,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Mock data for fallback
  // Utility to convert MongoDB format to HTTP format
  private mapMongoToHttp(mongoCenter: any): RescueCenter {
    return {
      _id: mongoCenter._id instanceof ObjectId ? mongoCenter._id : new ObjectId(mongoCenter._id),
      name: mongoCenter.name,
      location: mongoCenter.location,
      totalCapacity: mongoCenter.totalCapacity,
      currentGuests: mongoCenter.currentGuests,
      availableCapacity: mongoCenter.availableCapacity,
      resources: mongoCenter.resources,
      contact: mongoCenter.contact,
      address: mongoCenter.address,
      facilities: mongoCenter.facilities,
      status: mongoCenter.status,
      staffCount: mongoCenter.staffCount,
      lastUpdated: mongoCenter.lastUpdated instanceof Date ? mongoCenter.lastUpdated : new Date(mongoCenter.lastUpdated),
      createdAt: mongoCenter.createdAt instanceof Date ? mongoCenter.createdAt : new Date(mongoCenter.createdAt),
      updatedAt: mongoCenter.updatedAt instanceof Date ? mongoCenter.updatedAt : new Date(mongoCenter.updatedAt)
    };
  }

  // Mock data for fallback
  private getMockCenters(): RescueCenter[] {
    return [
      {
        _id: new ObjectId(),
        name: 'Central Emergency Shelter',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716]
        },
        totalCapacity: 500,
        currentGuests: 0,
        availableCapacity: 500,
        resources: {
          water: 85,
          food: 70,
          medical: 80,
          bedding: 75,
          clothing: 60
        },
        contact: {
          phone: '+91-80-2345-6789',
          emergency: {
            primary: '+91-80-2345-6789',
            secondary: '+91-80-2345-6790'
          }
        },
        address: 'MG Road, Bangalore, Karnataka 560001',
        facilities: ['Medical Aid', 'Sanitation', 'Power Backup', 'Communication', 'Kitchen'],
        status: 'active',
        staffCount: 25,
        lastUpdated: new Date(),
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'North Zone Emergency Hub',
        location: {
          type: 'Point',
          coordinates: [77.6146, 12.9916]
        },
        totalCapacity: 300,
        currentGuests: 0,
        availableCapacity: 300,
        resources: {
          water: 95,
          food: 60,
          medical: 90,
          bedding: 85,
          clothing: 70
        },
        contact: {
          phone: '+91-80-2345-6791',
          emergency: {
            primary: '+91-80-2345-6791'
          }
        },
        address: 'Hebbal Main Road, Bangalore, Karnataka 560024',
        facilities: ['Medical Aid', 'Sanitation', 'Kitchen', 'Children Area'],
        status: 'active',
        staffCount: 18,
        lastUpdated: new Date(),
        createdAt: new Date('2024-01-20T09:00:00Z'),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'South District Relief Center',
        location: {
          type: 'Point',
          coordinates: [77.5746, 12.9516]
        },
        totalCapacity: 400,
        currentGuests: 0,
        availableCapacity: 400,
        resources: {
          water: 40,
          food: 30,
          medical: 45,
          bedding: 30,
          clothing: 25
        },
        contact: {
          phone: '+91-80-2345-6792',
          emergency: {
            primary: '+91-80-2345-6792',
            secondary: '+91-80-2345-6793'
          }
        },
        address: '4th Block, Jayanagar, Bangalore, Karnataka 560011',
        facilities: ['Medical Aid', 'Sanitation', 'Power Backup'],
        status: 'active',
        staffCount: 20,
        lastUpdated: new Date(),
        createdAt: new Date('2024-01-18T14:00:00Z'),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'East Emergency Hub',
        location: {
          type: 'Point',
          coordinates: [77.6346, 12.9816]
        },
        totalCapacity: 250,
        currentGuests: 0,
        availableCapacity: 250,
        resources: {
          water: 75,
          food: 80,
          medical: 85,
          bedding: 90,
          clothing: 80
        },
        contact: {
          phone: '+91-80-2345-6794',
          emergency: {
            primary: '+91-80-2345-6794'
          }
        },
        address: 'ITPL Main Road, Whitefield, Bangalore, Karnataka 560066',
        facilities: ['Medical Aid', 'Kitchen', 'Communication', 'WiFi'],
        status: 'active',
        staffCount: 15,
        lastUpdated: new Date(),
        createdAt: new Date('2024-01-22T11:00:00Z'),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        name: 'West Relief Station',
        location: {
          type: 'Point',
          coordinates: [77.5546, 12.9616]
        },
        totalCapacity: 350,
        currentGuests: 0,
        availableCapacity: 350,
        resources: {
          water: 65,
          food: 75,
          medical: 70,
          bedding: 65,
          clothing: 55
        },
        contact: {
          phone: '+91-80-2345-6795',
          emergency: {
            primary: '+91-80-2345-6795',
            secondary: '+91-80-2345-6796'
          }
        },
        address: 'Dr. Rajkumar Road, Rajajinagar, Bangalore, Karnataka 560010',
        facilities: ['Medical Aid', 'Sanitation', 'Power Backup', 'Kitchen', 'Pharmacy'],
        status: 'active',
        staffCount: 22,
        lastUpdated: new Date(),
        createdAt: new Date('2024-01-25T08:00:00Z'),
        updatedAt: new Date()
      }
    ];
  }
}

export const httpDatabaseService = new HttpDatabaseService();