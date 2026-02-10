import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon.tech
  }
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Database connected');
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected database error:', err);
});

export default pool;