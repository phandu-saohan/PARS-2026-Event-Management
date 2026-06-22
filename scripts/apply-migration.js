/**
 * Apply Role Migration SQL to Supabase
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ LỖI: Chưa cấu hình DATABASE_URL trong file .env.local');
  process.exit(1);
}

const { Client } = pg;

async function runMigration() {
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

    const filePath = path.resolve(__dirname, '../supabase/add_roles_and_permissions.sql');
    console.log(`📖 Đang đọc file SQL: add_roles_and_permissions.sql...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('⚡ Đang thực thi migration...');
    await client.query(sql);
    console.log('🎉 Thực thi migration thành công!');
  } catch (err) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH CẬP NHẬT:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu.');
  }
}

runMigration();
