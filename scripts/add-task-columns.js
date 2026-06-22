/**
 * Script to add detailed_content and checklist columns to internal_tasks table on Supabase
 * Usage: node scripts/add-task-columns.js
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

async function addColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Add detailed_content (text) and checklist (jsonb) columns
    const sql = `
      ALTER TABLE public.internal_tasks 
      ADD COLUMN IF NOT EXISTS detailed_content TEXT DEFAULT '';

      ALTER TABLE public.internal_tasks 
      ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
    `;

    console.log('⚡ Adding detailed_content and checklist columns to internal_tasks...');
    await client.query(sql);
    console.log('🎉 Columns successfully added/verified in internal_tasks table!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

addColumns();
