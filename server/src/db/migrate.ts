import dotenv from 'dotenv';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function runMigration(): Promise<void> {
  try {
    console.log('🔄 Running database migration...\n');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);

    console.log('✅ Database tables created successfully!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();