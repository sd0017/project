import { RescueCenter, Guest, DisasterStats } from '../types/database';

export const demoCenters: RescueCenter[] = [
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
  }
];

export const demoGuests: Guest[] = [];

export const demoStats: DisasterStats = {
  totalCenters: demoCenters.length,
  totalGuests: 0,
  availableCapacity: demoCenters.reduce((sum, center) => sum + center.availableCapacity, 0),
  occupancyRate: 0,
  criticalCenters: 0,
  resourceStatus: {
    water: 90,
    food: 85,
    medical: 95
  },
  lastUpdated: new Date().toISOString()
};