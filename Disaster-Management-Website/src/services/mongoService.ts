import { MongoClient, Db, Collection, ObjectId, Document } from 'mongodb';import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

import { RescueCenter, Guest, DisasterStats, Notification, AuditLog } from '../types/database';import { RescueCenter, Guest, DisasterStats, Notification, AuditLog } from '../types/database';



class MongoService {import type { Document } from 'mongodb';

  private client: MongoClient | null = null;

  private db: Db | null = null;class MongoService {

  private collections: {  private client: MongoClient | null = null;

    centers: Collection<RescueCenter & Document>;  private db: Db | null = null;

    guests: Collection<Guest & Document>;  private collections: {

    stats: Collection<DisasterStats & Document>;    centers: Collection<RescueCenter & Document>;

    notifications: Collection<Notification & Document>;    guests: Collection<Guest & Document>;

    audit: Collection<AuditLog & Document>;    stats: Collection<DisasterStats & Document>;

  } | null = null;    notifications: Collection<Notification & Document>;

    audit: Collection<AuditLog & Document>;

  constructor(private uri: string, private dbName: string) {}  } | null = null;



  async connect() {  constructor(private uri: string, private dbName: string) {}

    try {

      if (!this.client) {  async connect() {

        this.client = await MongoClient.connect(this.uri);    try {

        this.db = this.client.db(this.dbName);      if (!this.client) {

        this.collections = {        this.client = await MongoClient.connect(this.uri);

          centers: this.db.collection<RescueCenter & Document>('centers'),        this.db = this.client.db(this.dbName);

          guests: this.db.collection<Guest & Document>('guests'),        this.collections = {

          stats: this.db.collection<DisasterStats & Document>('stats'),          centers: this.db.collection<RescueCenter>('centers'),

          notifications: this.db.collection<Notification & Document>('notifications'),          guests: this.db.collection<Guest>('guests'),

          audit: this.db.collection<AuditLog & Document>('audit')          stats: this.db.collection<DisasterStats>('stats'),

        };          notifications: this.db.collection<Notification>('notifications'),

          audit: this.db.collection<AuditLog>('audit')

        // Create indexes        };

        await this.createIndexes();

      }        // Create indexes

      return this.client;        await this.createIndexes();

    } catch (error) {      }

      console.error('Failed to connect to MongoDB:', error);      return this.client;

      throw error;    } catch (error) {

    }      console.error('Failed to connect to MongoDB:', error);

  }      throw error;

    }

  private async createIndexes() {  }

    if (!this.collections) throw new Error('Database not connected');

  private async createIndexes() {

    // Centers indexes    if (!this.collections) throw new Error('Database not connected');

    await this.collections.centers.createIndex({ 'location': '2dsphere' });

    await this.collections.centers.createIndex({ 'status': 1 });    // Create indexes

    await this.collections.centers.createIndex({ 'name': 1 });    await this.collections.centers.createIndex({ 'location': '2dsphere' });

    await this.collections.centers.createIndex({ 'status': 1 });

    // Guests indexes    await this.collections.centers.createIndex({ 'name': 1 });

    await this.collections.guests.createIndex({ 'stay.centerId': 1 });

    await this.collections.guests.createIndex({ 'personalInfo.aadharNumber': 1 }, { unique: true, sparse: true });    // Guests indexes

    await this.collections.guests.createIndex({     await this.collections.guests.createIndex({ 'stay.centerId': 1 });

      'personalInfo.firstName': 'text',     await this.collections.guests.createIndex({ 'personalInfo.aadharNumber': 1 }, { unique: true, sparse: true });

      'personalInfo.lastName': 'text',    await this.collections.guests.createIndex({ 

      'contact.phone': 'text'      'personalInfo.firstName': 'text', 

    });      'personalInfo.lastName': 'text',

      'contact.phone': 'text'

    // Notifications indexes    });

    await this.collections.notifications.createIndex({ 'target.centerId': 1 });

    await this.collections.notifications.createIndex({ 'target.userId': 1 });    // Notifications indexes

    await this.collections.notifications.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });    await this.collections.notifications.createIndex({ 'target.centerId': 1 });

    await this.collections.notifications.createIndex({ 'target.userId': 1 });

    // Audit logs indexes    await this.collections.notifications.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

    await this.collections.audit.createIndex({ 'entityType': 1, 'entityId': 1 });

    await this.collections.audit.createIndex({ 'createdAt': 1 });    // Audit logs indexes

  }    await this.collections.audit.createIndex({ 'entityType': 1, 'entityId': 1 });

    await this.collections.audit.createIndex({ 'createdAt': 1 });

  async disconnect() {  }

    if (this.client) {

      await this.client.close();  async disconnect() {

      this.client = null;    if (this.client) {

      this.db = null;      await this.client.close();

      this.collections = null;      this.client = null;

    }      this.db = null;

  }      this.collections = null;

    }

  // Rescue Center Operations  }

  async getCenters() {

    if (!this.collections) throw new Error('Database not connected');  // Rescue Center Operations

    return this.collections.centers.find().toArray();  async getCenters() {

  }    if (!this.collections) throw new Error('Database not connected');

    return this.collections.centers.find().toArray();

  async getCenterById(id: string | ObjectId) {  }

    if (!this.collections) throw new Error('Database not connected');

    return this.collections.centers.findOne({ _id: new ObjectId(id) });  async getCenterById(id: string | ObjectId) {

  }    if (!this.collections) throw new Error('Database not connected');

    return this.collections.centers.findOne({ _id: new ObjectId(id) });

  async createCenter(center: Omit<RescueCenter, '_id' | 'createdAt' | 'updatedAt'>) {  }

    if (!this.collections) throw new Error('Database not connected');

    const now = new Date();  async createCenter(center: Omit<RescueCenter, '_id' | 'createdAt' | 'updatedAt'>) {

    const newCenter: RescueCenter = {    if (!this.collections) throw new Error('Database not connected');

      ...center,    const now = new Date();

      createdAt: now,    const newCenter: RescueCenter = {

      updatedAt: now      ...center,

    };      createdAt: now,

    const result = await this.collections.centers.insertOne(newCenter);      updatedAt: now

    return this.getCenterById(result.insertedId);    };

  }    const result = await this.collections.centers.insertOne(newCenter);

    return this.getCenterById(result.insertedId);

  async updateCenter(id: string | ObjectId, updates: Partial<RescueCenter>) {  }

    if (!this.collections) throw new Error('Database not connected');

    const now = new Date();  async updateCenter(id: string | ObjectId, updates: Partial<RescueCenter>) {

    const result = await this.collections.centers.findOneAndUpdate(    if (!this.collections) throw new Error('Database not connected');

      { _id: new ObjectId(id) },    const now = new Date();

      {     const result = await this.collections.centers.findOneAndUpdate(

        $set: {       { _id: new ObjectId(id) },

          ...updates,      { 

          updatedAt: now         $set: { 

        }           ...updates,

      },          updatedAt: now 

      { returnDocument: 'after' }        } 

    );      },

    return result ? result : null;      { returnDocument: 'after' }

  }    );

    return result ? result : null;

  async deleteCenter(id: string | ObjectId) {  }

    if (!this.collections) throw new Error('Database not connected');

    await this.collections.centers.deleteOne({ _id: new ObjectId(id) });  async deleteCenter(id: string | ObjectId) {

  }    if (!this.collections) throw new Error('Database not connected');

    await this.collections.centers.deleteOne({ _id: new ObjectId(id) });

  // Guest Operations  }

  async getGuests(query: Partial<Guest> = {}) {

    if (!this.collections) throw new Error('Database not connected');  // Guest Operations

    return this.collections.guests.find(query).toArray();  async getGuests(query: Partial<Guest> = {}) {

  }    if (!this.collections) throw new Error('Database not connected');

    return this.collections.guests.find(query).toArray();

  async getGuestById(id: string | ObjectId) {  }

    if (!this.collections) throw new Error('Database not connected');

    return this.collections.guests.findOne({ _id: new ObjectId(id) });  async getGuestById(id: string | ObjectId) {

  }    if (!this.collections) throw new Error('Database not connected');

    return this.collections.guests.findOne({ _id: new ObjectId(id) });

  async getGuestsByCenter(centerId: string | ObjectId) {  }

    if (!this.collections) throw new Error('Database not connected');

    return this.collections.guests.find({   async getGuestsByCenter(centerId: string | ObjectId) {

      'stay.centerId': new ObjectId(centerId),    if (!this.collections) throw new Error('Database not connected');

      'stay.status': { $ne: 'discharged' }    return this.collections.guests.find({ 

    }).toArray();      'stay.centerId': new ObjectId(centerId),

  }      'stay.status': { $ne: 'discharged' }

    }).toArray();

  async createGuest(guest: Omit<Guest, '_id' | 'createdAt' | 'updatedAt'>) {  }

    if (!this.collections) throw new Error('Database not connected');

    const now = new Date();  async createGuest(guest: Omit<Guest, '_id' | 'createdAt' | 'updatedAt'>) {

    const newGuest: Guest = {    if (!this.collections) throw new Error('Database not connected');

      ...guest,    const now = new Date();

      createdAt: now,    const newGuest: Guest = {

      updatedAt: now      ...guest,

    };      createdAt: now,

    const result = await this.collections.guests.insertOne(newGuest);      updatedAt: now

    return this.getGuestById(result.insertedId);    };

  }    const result = await this.collections.guests.insertOne(newGuest);

    return this.getGuestById(result.insertedId);

  async updateGuest(id: string | ObjectId, updates: Partial<Guest>) {  }

    if (!this.collections) throw new Error('Database not connected');

    const now = new Date();  async updateGuest(id: string | ObjectId, updates: Partial<Guest>) {

    const result = await this.collections.guests.findOneAndUpdate(    if (!this.collections) throw new Error('Database not connected');

      { _id: new ObjectId(id) },    const now = new Date();

      {     const result = await this.collections.guests.findOneAndUpdate(

        $set: {       { _id: new ObjectId(id) },

          ...updates,      { 

          updatedAt: now         $set: { 

        }           ...updates,

      },          updatedAt: now 

      { returnDocument: 'after' }        } 

    );      },

    return result ? result : null;      { returnDocument: 'after' }

  }    );

    return result ? result : null;

  async deleteGuest(id: string | ObjectId) {  }

    if (!this.collections) throw new Error('Database not connected');

    await this.collections.guests.deleteOne({ _id: new ObjectId(id) });  async deleteGuest(id: string | ObjectId) {

  }    if (!this.collections) throw new Error('Database not connected');

    await this.collections.guests.deleteOne({ _id: new ObjectId(id) });

  // Statistics Operations  }

  async getDisasterStats() {

    if (!this.collections) throw new Error('Database not connected');  // Statistics Operations

    const stats = await this.collections.stats.findOne();  async getDisasterStats() {

    if (!stats) {    if (!this.collections) throw new Error('Database not connected');

      // Create initial stats if not exists    const stats = await this.collections.stats.findOne();

      const initialStats: DisasterStats = {    if (!stats) {

        totalCenters: 0,      // Create initial stats if not exists

        totalGuests: 0,      const initialStats: DisasterStats = {

        availableCapacity: 0,        totalCenters: 0,

        occupancyRate: 0,        totalGuests: 0,

        resourceStatus: {        availableCapacity: 0,

          water: 100,        occupancyRate: 0,

          food: 100,        resourceStatus: {

          medical: 100          water: 100,

        },          food: 100,

        criticalCenters: 0,          medical: 100

        lastUpdated: new Date(),        },

        createdAt: new Date(),        criticalCenters: 0,

        updatedAt: new Date()        lastUpdated: new Date(),

      };        createdAt: new Date(),

      await this.collections.stats.insertOne(initialStats);        updatedAt: new Date()

      return initialStats;      };

    }      await this.collections.stats.insertOne(initialStats);

    return stats;      return initialStats;

  }    }

    return stats;

  async updateStats(updates: Partial<DisasterStats>) {  }

    if (!this.collections) throw new Error('Database not connected');

    const now = new Date();  async updateStats(updates: Partial<DisasterStats>) {

    const result = await this.collections.stats.findOneAndUpdate(    if (!this.collections) throw new Error('Database not connected');

      {},    const now = new Date();

      {     const result = await this.collections.stats.findOneAndUpdate(

        $set: {       {},

          ...updates,      { 

          lastUpdated: now,        $set: { 

          updatedAt: now           ...updates,

        }           lastUpdated: now,

      },          updatedAt: now 

      {         } 

        returnDocument: 'after',      },

        upsert: true       { 

      }        returnDocument: 'after',

    );        upsert: true 

    return result ? result : null;      }

  }    );

    return result ? result : null;

  // Notification Operations  }

  async createNotification(notification: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>) {

    if (!this.collections) throw new Error('Database not connected');  // Notification Operations

    const now = new Date();  async createNotification(notification: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>) {

    const newNotification: Notification = {    if (!this.collections) throw new Error('Database not connected');

      ...notification,    const now = new Date();

      createdAt: now,    const newNotification: Notification = {

      updatedAt: now      ...notification,

    };      createdAt: now,

    return this.collections.notifications.insertOne(newNotification);      updatedAt: now

  }    };

    return this.collections.notifications.insertOne(newNotification);

  // Audit Operations  }

  async createAuditLog(log: Omit<AuditLog, '_id' | 'createdAt' | 'updatedAt'>) {

    if (!this.collections) throw new Error('Database not connected');  // Audit Operations

    const now = new Date();  async createAuditLog(log: Omit<AuditLog, '_id' | 'createdAt' | 'updatedAt'>) {

    const newLog: AuditLog = {    if (!this.collections) throw new Error('Database not connected');

      ...log,    const now = new Date();

      createdAt: now,    const newLog: AuditLog = {

      updatedAt: now      ...log,

    };      createdAt: now,

    return this.collections.audit.insertOne(newLog);      updatedAt: now

  }    };

}    return this.collections.audit.insertOne(newLog);

  }

// Create and export service instance}

const mongoService = new MongoService(

  process.env.MONGODB_URI || 'mongodb://localhost:27017',// Create and export service instance

  process.env.MONGODB_DB || 'disaster_management'const mongoService = new MongoService(

);  process.env.MONGODB_URI || 'mongodb://localhost:27017',

  process.env.MONGODB_DB || 'disaster_management'

export default mongoService;);

export default mongoService;

export interface MongoGuest {
  _id?: string;
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

export interface MongoAuthResponse {
  token: string;
  user: MongoUser;
}

export interface MongoStats {
  totalCenters: number;
  totalCapacity: number;
  totalOccupancy: number;
  availableSpace: number;
  centersWithCriticalSupplies: number;
  recentlyUpdatedCenters: number;
  averageOccupancyRate: number;
}

class MongoService {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxRetries: number = 3;

  constructor() {
    this.initializeConnection();
  }

  // Initialize MongoDB connection (placeholder for actual MongoDB client)
  private async initializeConnection(): Promise<void> {
    try {
      // In a real implementation, this would initialize MongoDB client
      // const client = new MongoClient(mongoConfig.connection.uri, mongoConfig.connection.options);
      // await client.connect();
      // this.isConnected = true;
      
      // For now, we'll simulate connection check
      console.log('MongoDB service initialized (ready for MongoDB integration)');
      this.isConnected = false; // Set to false until actual MongoDB is integrated
    } catch (error) {
      console.log('MongoDB not available, using offline mode');
      this.isConnected = false;
    }
  }

  // Check if MongoDB is available
  public isMongoAvailable(): boolean {
    return this.isConnected;
  }

  // Utility method to convert MongoDB document to application format
  private mongoToApp<T extends { _id?: string; id?: string }>(doc: T): T {
    if (doc._id && !doc.id) {
      doc.id = doc._id.toString();
    }
    return doc;
  }

  // Utility method to convert application format to MongoDB
  private appToMongo<T extends { _id?: string; id?: string }>(doc: T): T {
    if (doc.id && !doc._id) {
      doc._id = doc.id;
    }
    return doc;
  }

  // Authentication methods
  async authenticateUser(email: string, password: string): Promise<MongoAuthResponse> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB authentication
      // const users = db.collection(mongoConfig.collections.users);
      // const user = await users.findOne({ email, password: hashedPassword });
      throw new Error('MongoDB authentication not yet implemented');
    }

    // Fallback to localStorage
    return this.authenticateUserLocal(email, password);
  }

  async authenticateGovernment(employeeId: string, password: string): Promise<MongoAuthResponse> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB authentication
      // const govUsers = db.collection(mongoConfig.collections.governmentUsers);
      // const user = await govUsers.findOne({ employeeId, password: hashedPassword });
      throw new Error('MongoDB government authentication not yet implemented');
    }

    // Fallback to mock data
    if (employeeId === 'GOV001' && password === 'password123') {
      const user: MongoUser = {
        id: 'gov_001',
        email: 'government@disaster.gov.in',
        role: 'government',
        employeeId: employeeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { token: this.generateToken(user), user };
    }
    throw new Error('Invalid government credentials');
  }

  async authenticateRescueCenter(centerId: string, password: string): Promise<MongoAuthResponse> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB authentication
      // const rcUsers = db.collection(mongoConfig.collections.rescueCenterUsers);
      // const user = await rcUsers.findOne({ centerId, password: hashedPassword });
      throw new Error('MongoDB rescue center authentication not yet implemented');
    }

    // Fallback to mock data
    if (centerId === 'RC001' && password === 'rescue123') {
      const user: MongoUser = {
        id: 'rc_001',
        email: 'center@rescue.gov.in',
        role: 'rescue-center',
        centerId: centerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { token: this.generateToken(user), user };
    }
    throw new Error('Invalid rescue center credentials');
  }

  // User management
  async createUser(userData: Omit<MongoUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<MongoUser> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB user creation
      // const users = db.collection(mongoConfig.collections.users);
      // const result = await users.insertOne({
      //   ...userData,
      //   createdAt: new Date(),
      //   updatedAt: new Date()
      // });
      // return await users.findOne({ _id: result.insertedId });
      throw new Error('MongoDB user creation not yet implemented');
    }

    // Fallback to localStorage
    return this.createUserLocal(userData);
  }

  async getUserById(id: string): Promise<MongoUser | null> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB user retrieval
      // const users = db.collection(mongoConfig.collections.users);
      // const user = await users.findOne({ _id: new ObjectId(id) });
      // return user ? this.mongoToApp(user) : null;
      throw new Error('MongoDB user retrieval not yet implemented');
    }

    // Fallback to localStorage
    return this.getUserByIdLocal(id);
  }

  // Rescue Center management
  async getAllCenters(): Promise<MongoRescueCenter[]> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB center retrieval
      // const centers = db.collection(mongoConfig.collections.rescueCenters);
      // const result = await centers.find({ status: { $ne: 'inactive' } }).toArray();
      // return result.map(center => this.mongoToApp(center));
      throw new Error('MongoDB center retrieval not yet implemented');
    }

    // Fallback to localStorage
    return this.getAllCentersLocal();
  }

  async getCenterById(id: string): Promise<MongoRescueCenter | null> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB center retrieval
      throw new Error('MongoDB center retrieval not yet implemented');
    }

    // Fallback to localStorage
    return this.getCenterByIdLocal(id);
  }

  async createCenter(centerData: Omit<MongoRescueCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<MongoRescueCenter> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB center creation
      throw new Error('MongoDB center creation not yet implemented');
    }

    // Fallback to localStorage
    return this.createCenterLocal(centerData);
  }

  async updateCenter(id: string, updates: Partial<MongoRescueCenter>): Promise<MongoRescueCenter> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB center update
      throw new Error('MongoDB center update not yet implemented');
    }

    // Fallback to localStorage
    return this.updateCenterLocal(id, updates);
  }

  // Guest management
  async getAllGuests(): Promise<MongoGuest[]> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB guest retrieval
      throw new Error('MongoDB guest retrieval not yet implemented');
    }

    // Fallback to localStorage
    return this.getAllGuestsLocal();
  }

  async getGuestsByCenter(centerId: string): Promise<MongoGuest[]> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB guest retrieval by center
      throw new Error('MongoDB guest retrieval not yet implemented');
    }

    // Fallback to localStorage
    return this.getGuestsByCenterLocal(centerId);
  }

  async createGuest(guestData: Omit<MongoGuest, 'id' | 'createdAt' | 'updatedAt'>): Promise<MongoGuest> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB guest creation
      throw new Error('MongoDB guest creation not yet implemented');
    }

    // Fallback to localStorage
    return this.createGuestLocal(guestData);
  }

  // Statistics
  async getStats(): Promise<MongoStats> {
    if (this.isConnected) {
      // TODO: Implement actual MongoDB aggregation for stats
      throw new Error('MongoDB stats not yet implemented');
    }

    // Fallback to local calculation
    return this.getStatsLocal();
  }

  // Private helper methods for localStorage fallback
  private generateToken(user: MongoUser): string {
    return `mongo_token_${user.id}_${Date.now()}`;
  }

  private authenticateUserLocal(email: string, password: string): MongoAuthResponse {
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error('User not found');
    return { token: this.generateToken(user), user };
  }

  private createUserLocal(userData: Omit<MongoUser, 'id' | 'createdAt' | 'updatedAt'>): MongoUser {
    const users = this.getStoredUsers();
    const newUser: MongoUser = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('mongo_users', JSON.stringify(users));
    return newUser;
  }

  private getUserByIdLocal(id: string): MongoUser | null {
    const users = this.getStoredUsers();
    return users.find(u => u.id === id) || null;
  }

  private getAllCentersLocal(): MongoRescueCenter[] {
    const centers = localStorage.getItem('mongo_centers');
    return centers ? JSON.parse(centers) : [];
  }

  private getCenterByIdLocal(id: string): MongoRescueCenter | null {
    const centers = this.getAllCentersLocal();
    return centers.find(c => c.id === id) || null;
  }

  private createCenterLocal(centerData: Omit<MongoRescueCenter, 'id' | 'createdAt' | 'updatedAt'>): MongoRescueCenter {
    const centers = this.getAllCentersLocal();
    const newCenter: MongoRescueCenter = {
      ...centerData,
      id: `RC${String(centers.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    centers.push(newCenter);
    localStorage.setItem('mongo_centers', JSON.stringify(centers));
    return newCenter;
  }

  private updateCenterLocal(id: string, updates: Partial<MongoRescueCenter>): MongoRescueCenter {
    const centers = this.getAllCentersLocal();
    const index = centers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Center not found');
    
    centers[index] = { ...centers[index], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem('mongo_centers', JSON.stringify(centers));
    return centers[index];
  }

  private getAllGuestsLocal(): MongoGuest[] {
    const guests = localStorage.getItem('mongo_guests');
    return guests ? JSON.parse(guests) : [];
  }

  private getGuestsByCenterLocal(centerId: string): MongoGuest[] {
    const guests = this.getAllGuestsLocal();
    return guests.filter(g => g.centerId === centerId);
  }

  private createGuestLocal(guestData: Omit<MongoGuest, 'id' | 'createdAt' | 'updatedAt'>): MongoGuest {
    const guests = this.getAllGuestsLocal();
    const newGuest: MongoGuest = {
      ...guestData,
      id: `GUEST${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    guests.push(newGuest);
    localStorage.setItem('mongo_guests', JSON.stringify(guests));
    return newGuest;
  }

  private getStatsLocal(): MongoStats {
    const centers = this.getAllCentersLocal();
    const totalCenters = centers.length;
    const totalCapacity = centers.reduce((sum, center) => sum + center.totalCapacity, 0);
    const totalOccupancy = centers.reduce((sum, center) => sum + center.currentGuests, 0);
    const availableSpace = totalCapacity - totalOccupancy;
    
    return {
      totalCenters,
      totalCapacity,
      totalOccupancy,
      availableSpace,
      centersWithCriticalSupplies: centers.filter(c => 
        c.waterLevel < 30 || c.foodLevel < 30 || c.supplies.medical < 30
      ).length,
      recentlyUpdatedCenters: centers.filter(c => {
        const lastUpdated = new Date(c.lastUpdated);
        const now = new Date();
        const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        return diffInHours <= 2;
      }).length,
      averageOccupancyRate: totalCapacity > 0 ? (totalOccupancy / totalCapacity) * 100 : 0
    };
  }

  private getStoredUsers(): MongoUser[] {
    const users = localStorage.getItem('mongo_users');
    return users ? JSON.parse(users) : [];
  }
}

export const mongoService = new MongoService();