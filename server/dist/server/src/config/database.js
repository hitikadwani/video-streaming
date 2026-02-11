"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
// Create PostgreSQL connection pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon.tech
    }
});
// Test connection
pool.on('connect', () => {
    console.log('✓ Database connected');
});
pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});
exports.default = pool;
//# sourceMappingURL=database.js.map