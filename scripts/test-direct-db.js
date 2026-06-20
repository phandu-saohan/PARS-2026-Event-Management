import pg from 'pg';

const password = "Vanduonline@99";
const projectRef = "fiifqrffravksxkydmkg";

const testStrings = [
  // 1. Direct connection string (IPv6)
  `postgresql://postgres:${encodeURIComponent(password)}@db.fiifqrffravksxkydmkg.supabase.co:5432/postgres`,
  // 2. Direct connection with sslmode=require
  `postgresql://postgres:${encodeURIComponent(password)}@db.fiifqrffravksxkydmkg.supabase.co:5432/postgres?sslmode=require`
];

async function testConnections() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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
