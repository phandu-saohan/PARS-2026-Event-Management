/**
 * Script to add landing page image configuration columns to business_config table on Supabase
 * Usage: node scripts/add-landing-images-columns.js
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

async function migrate() {
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
      ADD COLUMN IF NOT EXISTS landing_logo_url TEXT,
      ADD COLUMN IF NOT EXISTS landing_landmarks_url TEXT,
      ADD COLUMN IF NOT EXISTS landing_slide1_url TEXT,
      ADD COLUMN IF NOT EXISTS landing_slide2_url TEXT,
      ADD COLUMN IF NOT EXISTS landing_slide3_url TEXT,
      ADD COLUMN IF NOT EXISTS landing_slide4_url TEXT;
    `;

    console.log('⚡ Adding landing page image columns to business_config...');
    await client.query(sql);
    console.log('🎉 Landing page image columns successfully added/verified in business_config table!');
  } catch (err) {
    console.error('❌ Error executing database migration:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

migrate();
