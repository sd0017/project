"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
exports.app = (0, express_1.default)();
// Configure CORS for all origins in development
exports.app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Parse JSON bodies
exports.app.use(express_1.default.json());
// Add basic request logging
exports.app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
exports.app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// Register all API routes
exports.app.use('/api', routes_1.default);
// Basic error handler
exports.app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
exports.default = exports.app;
