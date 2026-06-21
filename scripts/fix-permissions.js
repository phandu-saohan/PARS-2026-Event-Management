/**
 * Script to fix Supabase PostgreSQL table permissions
 * Usage: node scripts/fix-permissions.js
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { Client } = pg;

async function fixPermissions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const sql = `
      -- Grant schema usage
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;

      -- Grant privileges on all existing tables, sequences, and functions
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
      GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

      -- Alter default privileges for future objects
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
    `;

    console.log('⚡ Running SQL to fix table permissions...');
    await client.query(sql);
    console.log('🎉 Permissions successfully granted to anon, authenticated, and service_role!');
  } catch (err) {
    console.error('❌ Error executing permissions fix:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

fixPermissions();
