/**
 * Script to add comments column to internal_tasks table on Supabase
 * Usage: node scripts/add-comments-column.js
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

async function addCommentsColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const sql = `
      ALTER TABLE public.internal_tasks 
      ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
    `;

    console.log('⚡ Adding comments column to internal_tasks...');
    await client.query(sql);
    console.log('🎉 Column comments successfully added/verified in internal_tasks table!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

addCommentsColumn();
