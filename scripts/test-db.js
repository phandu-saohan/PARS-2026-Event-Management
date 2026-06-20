import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const password = "Vanduonline@99";
const projectRef = "fiifqrffravksxkydmkg";

const testStrings = [
  // 1. Transaction Pooler (Port 6543)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  // 2. Session Pooler (Port 5432 - on pooler host)
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  // 3. Alternate Pooler hostname format if any
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require`
];

async function testConnections() {
  for (let i = 0; i < testStrings.length; i++) {
    const connStr = testStrings[i];
    console.log(`\nTesting connection string #${i + 1}: ${connStr.replace(password, '****')}`);
    const client = new pg.Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      await client.connect();
      console.log(`✅ Success! Connection #${i + 1} works.`);
      await client.end();
      return connStr;
    } catch (err) {
      console.log(`❌ Fail: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }
  return null;
}

testConnections();
