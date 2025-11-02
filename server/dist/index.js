"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
}
console.log('📊 Debug: Starting server...');
console.log('📊 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGO_URI: MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') // Hide credentials in logs
});
const server = http_1.default.createServer(app_1.default);
async function start() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        await mongoose_1.default.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            socketTimeoutMS: 45000, // 45 second timeout
            retryWrites: true,
            w: 'majority'
        });
        console.log('✅ Connected to MongoDB Atlas');
        // Log some connection info for debugging
        const db = mongoose_1.default.connection;
        console.log(`📡 Connected to database: ${db.name}`);
        console.log(`🔐 Auth success: ${db.readyState === 1 ? 'Yes' : 'No'}`);
        server.listen(PORT, () => {
            console.log('📡 Debug: Server bound to port', PORT);
            console.log('🔍 Debug: Testing endpoint availability...');
            // Self-test the health endpoint
            fetch(`http://localhost:${PORT}/health`)
                .then(response => response.json())
                .then(data => console.log('✅ Server is responding:', data))
                .catch(err => console.error('⚠️ Server self-test failed:', err));
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log('🌐 Available endpoints:');
            console.log('   POST /auth/register');
            console.log('   POST /auth/login');
            console.log('   GET  /auth/me (protected)');
            console.log('   GET  /centers');
            console.log('   POST /centers (protected)');
            console.log('   GET  /guests');
            console.log('   POST /guests (protected)');
        });
    }
    catch (err) {
        if (err instanceof Error) {
            console.error('❌ MongoDB connection error:', err.message);
            if (err.message.includes('ECONNREFUSED')) {
                console.error('💡 If using Atlas, check your network connection and whitelist your IP');
            }
            else if (err.message.includes('bad auth')) {
                console.error('� Check your database username and password in MONGODB_URI');
            }
            else if (err.message.includes('getaddrinfo')) {
                console.error('💡 Check your cluster hostname in MONGODB_URI');
            }
        }
        process.exit(1);
    }
}
start();
