/**
 * Script to add add_on_services column to business_config table on Supabase
 * Usage: node scripts/add-column.js
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

async function addColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const sql = `
      ALTER TABLE public.business_config 
      ADD COLUMN IF NOT EXISTS add_on_services JSONB DEFAULT '[]'::jsonb;
    `;

    console.log('⚡ Adding add_on_services column...');
    await client.query(sql);
    console.log('🎉 Column add_on_services successfully added to business_config table!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

addColumn();
