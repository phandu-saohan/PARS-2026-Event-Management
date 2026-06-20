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

    // 1. Apply Schema
    const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');
    console.log(`\n📖 Đang đọc schema DDL từ: ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚡ Đang khởi tạo các bảng và cấu hình RLS...');
    await client.query(schemaSql);
    console.log('🎉 Khởi tạo bảng và phân quyền RLS thành công!');

    // 2. Apply Seed Data
    const seedPath = path.resolve(__dirname, '../supabase/seed.sql');
    console.log(`\n📖 Đang đọc seed data từ: ${seedPath}...`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('⚡ Đang nạp dữ liệu cấu hình và mock data mẫu...');
    await client.query(seedSql);
    console.log('🎉 Nạp dữ liệu seed thành công!');

    console.log('\n🚀 CƠ SỞ DỮ LIỆU CỦA BẠN ĐÃ ĐƯỢC CẬP NHẬT HOÀN TOÀN TRÊN SUPABASE!');
  } catch (err) {
    console.error('\n❌ LỖI TRONG QUÁ TRÌNH CẬP NHẬT:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Đã đóng kết nối cơ sở dữ liệu.');
  }
}

runMigration();
