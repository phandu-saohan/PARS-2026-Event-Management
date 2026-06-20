/**
 * Database Migration Script for Supabase
 * Tự động kết nối và nạp schema.sql + seed.sql vào Supabase PostgreSQL
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
  console.log('\nVui lòng thêm dòng sau vào file .env.local:');
  console.log('DATABASE_URL=postgresql://postgres:[MẬT_KHẨU_DỰ_ÁN]@db.ggvlheozoodvkbbrmrri.supabase.co:5432/postgres\n');
  console.log('Bạn có thể lấy mật khẩu dự án khi tạo Database trên Supabase Dashboard.');
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

    // 0. Reset Schema (Clean Wipe to prevent duplicate/exists conflicts)
    console.log('\n🧹 Đang dọn dẹp và làm sạch public schema...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Làm sạch public schema thành công!');

    const sqlFiles = [
      'schema.sql',
      'add_contacts_table.sql',
      'add_schedule_management_tables.sql',
      'add_notification_module_tables.sql',
      'add_doctor_proof_url.sql',
      'seed.sql'
    ];

    for (const file of sqlFiles) {
      const filePath = path.resolve(__dirname, `../supabase/${file}`);
      console.log(`\n📖 Đang đọc file SQL: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`⚡ Đang nạp dữ liệu/thực thi ${file}...`);
      await client.query(sql);
      console.log(`🎉 Thực thi ${file} thành công!`);
    }

    console.log('\n🚀 CƠ SỞ DỮ LIỆU CỦA BẠN ĐÃ ĐƯỢC THIẾT LẬP HOÀN TOÀN TRÊN SUPABASE!');
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH CẬP NHẬT:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu.');
  }
}

runMigration();
