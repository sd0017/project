import {
	MongoClient,
	Db,
	Collection,
	Document,
	MongoClientOptions,
	IndexSpecification,
} from 'mongodb';

/**
 * Central MongoDB service (singleton) used across the app.
 *
 * Usage:
 *  import mongoService from './services/mongoService';
 *  await mongoService.connect();
 *  const users = mongoService.getCollection<User>('users');
 */
export class MongoService {
	private static instance: MongoService;
	private client: MongoClient | null = null;
	private db: Db | null = null;
		// store as Collection<any> internally to avoid generic-cast conflicts when caching
		private collections: Record<string, Collection<any>> = {};

	private constructor() {}

	public static getInstance(): MongoService {
		if (!MongoService.instance) {
			MongoService.instance = new MongoService();
		}
		return MongoService.instance;
	}

	/**
	 * Connect to MongoDB. If a connection already exists, returns the existing Db.
	 * It reads MONGO_URI and MONGO_DB from environment when parameters are not provided.
	 */
	public async connect(
		uri?: string,
		dbName?: string,
		options?: MongoClientOptions
	): Promise<Db> {
		if (this.db) return this.db;

			// Prefer passed uri, then Vite env var (frontend), then fail.
			const mongoUri = uri || (import.meta as any).env?.VITE_MONGO_URI;
			if (!mongoUri) {
				throw new Error('MONGO_URI is not set (VITE_MONGO_URI) and no uri was provided to connect()');
			}

			// Create client and connect. Only pass options when provided.
			this.client = options ? new MongoClient(mongoUri, options) : new MongoClient(mongoUri);
		await this.client.connect();

		// Determine database name: explicit param > env var > implicit from URI
		const databaseName = dbName || (import.meta as any).env?.VITE_MONGO_DB || undefined;
		this.db = this.client.db(databaseName);

		return this.db;
	}

	/** Return the active Db instance or throw if not connected. */
	public getDb(): Db {
		if (!this.db) throw new Error('MongoService: not connected. Call connect() first.');
		return this.db;
	}

	/**
	 * Return a typed collection. Caches collection objects per name.
	 * Example: const users = mongoService.getCollection<User>('users');
	 */
	public getCollection<T extends Document = Document>(name: string): Collection<T> {
		if (!this.db) throw new Error('MongoService: not connected. Call connect() first.');

			if (!this.collections[name]) {
				this.collections[name] = this.db.collection<T>(name as string);
			}
			return this.collections[name] as Collection<T>;
	}

	/**
	 * Create one or many indexes on a collection. Accepts the same arguments as
	 * Collection.createIndex / createIndexes.
	 */
	public async createIndex(
		collectionName: string,
		indexSpec: IndexSpecification | IndexSpecification[],
		options?: Record<string, unknown>
	) {
		const coll = this.getCollection(collectionName);
		if (Array.isArray(indexSpec)) {
			// createIndexes
			return coll.createIndexes(indexSpec as any);
		}
		return coll.createIndex(indexSpec as any, options as any);
	}

	/**
	 * Close the client and clear cached state.
	 */
	public async close(): Promise<void> {
		if (this.client) {
			try {
				await this.client.close();
			} catch (err) {
				// swallow close errors but log for visibility
				// eslint-disable-next-line no-console
				console.error('Error closing MongoDB client', err);
			}
		}
		this.client = null;
		this.db = null;
		this.collections = {};
	}

	/** Convenience check */
	public isConnected(): boolean {
		return !!(this.client && this.db);
	}
}

const mongoService = MongoService.getInstance();
export default mongoService;

