/**
 * Script to elevate admin@admin.com to Admin status on Supabase
 * Usage: node scripts/make-admin.js
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable TLS unauthorized rejection to support self-signed certificates in Supabase pooler
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes('YOUR_DATABASE_PASSWORD')) {
  console.error('❌ LỖI: Chưa cấu hình DATABASE_URL trong file .env.local');
  process.exit(1);
}

const { Client } = pg;

async function makeAdmin() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Đang kết nối tới cơ sở dữ liệu Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Kết nối thành công!');

    const filePath = path.resolve(__dirname, '../supabase/make_admin.sql');
    console.log(`\n📖 Đang đọc file SQL: ${filePath}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log('⚡ Đang thực thi script cấp quyền Admin cho admin@admin.com...');
    
    // We listen to NOTICE events from PostgreSQL (e.g. RAISE NOTICE)
    client.on('notice', (msg) => {
      console.log(`📝 [PostgreSQL Notice] ${msg.message}`);
    });

    await client.query(sql);
    console.log('\n🎉 CẤP QUYỀN ADMIN THÀNH CÔNG!');
    console.log('💡 Lưu ý: Hãy chắc chắn rằng tài khoản admin@admin.com đã được đăng ký trong phần Authentication trên Supabase Dashboard để có thể đăng nhập được.');
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH THỰC THI SCRIPT:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu.');
  }
}

makeAdmin();
