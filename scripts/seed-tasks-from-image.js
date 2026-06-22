/**
 * Script to seed internal_tasks table with the 37 tasks from the event organization spreadsheet image
 * Usage: node scripts/seed-tasks-from-image.js
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

// Helper to convert DD/MM/YYYY to YYYY-MM-DD
function parseDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}

const tasksData = [
  { id: 'TSK-001', title: 'Liên hệ địa điểm tổ chức', assignedToName: 'A Bửu', status: 'done', progress: 100, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-002', title: 'Soạn thư mời và gửi thư mời BCV quốc tế, trong nước', assignedToName: 'Thầy Tùng, Thư, Chị Như', status: 'done', progress: 100, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-003', title: 'Nhận CV, Phân công dịch bài, lý lịch', assignedToName: 'Thầy Tùng - Tất cả bác sĩ PTTM - Thư - C Như', status: 'done', progress: 100, deadline: '14/08/2026', notes: 'Thầy Phúc, Cô Trúc, Thầy Liêm, Thầy Hà, Thầy Lâm dịch thơ (Đang sử dụng bài cũ)' },
  { id: 'TSK-004', title: 'Soạn chương trình chi tiết', assignedToName: 'Thầy - Thư - C Như', status: 'done', progress: 100, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-005', title: 'Tổng hợp hồ sơ gửi xin giấy phép', assignedToName: 'Thư', status: 'done', progress: 100, deadline: '14/08/2026', notes: 'Đã gửi hồ sơ cho BS Du ngày 15/06/2026' },
  { id: 'TSK-006', title: 'Hoàn thiện website hoặc Landing page cung cấp thông tin sự kiện', assignedToName: 'IT, Thảo, Phụng', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-007', title: 'Viết bài truyền thông trước sự kiện, Thông cáo báo chí, thiết kế hình ảnh bài viết...', assignedToName: 'Marketing (Quỳnh, Như, Hiệp, Sang, Phụng)', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-008', title: 'Đặt bài PR trên Báo điện tử', assignedToName: 'Huy - Thảo', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-009', title: 'Handbook sự kiện', assignedToName: 'Thầy Tùng + C Như', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-010', title: 'Thiệp mời tham dự sự kiện (BCV chính thức, Gala Dinner, Thông tin CT) hoặc thư xác nhận online', assignedToName: 'Thầy, Thư, Chị Như', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-011', title: 'Gửi thông tin báo cáo viên nước ngoài cho trung tâm hội nghị', assignedToName: 'Bửu - Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-012', title: 'Chốt menu tea-break', assignedToName: 'Bác Khiêm - Anh Bửu', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-013', title: 'Chốt gala dinner', assignedToName: 'Bác Khiêm - Anh Bửu', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-014', title: 'Chốt bố trí hội trường', assignedToName: 'Bác Khiêm - Anh Bửu', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-015', title: 'Chốt danh sách phòng khách sạn', assignedToName: 'Anh Bửu', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-016', title: 'Chốt xe đưa đón', assignedToName: 'Anh Bửu', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-017', title: 'Background màn LED sự kiện chính + Background hội trường + Background Party', assignedToName: 'Marketing (Quỳnh, Như, Hiệp, Sang)', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-018', title: 'Biển tên để bàn báo cáo viên/đại biểu/khách mời danh dự', assignedToName: 'C Như - Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-019', title: 'Các loại thẻ đeo (BCV, Đại biểu, Khách mời, Ban tổ chức...)', assignedToName: 'C Như - Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-020', title: 'Duyệt thiết kế mẫu chứng nhận tham dự chương trình', assignedToName: 'Bác Khiêm; Thầy; Chị Như', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-021', title: 'Ký hợp đồng truyền thông (nếu có)', assignedToName: 'Bác Khiêm; Bs Thảo, Bs Như, Thảo', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-022', title: 'Gửi thư mời đại biểu, khách mời, BCV qua mail/thư... (02 đợt tháng 7 và tháng 8)', assignedToName: 'Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-023', title: 'Công tác hậu cần cho BCV, đại biểu (Khách sạn, vé máy bay, đưa đón...)', assignedToName: 'Anh Bửu, BS Như, Kim An, BS Bảo, Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-024', title: 'Chốt danh sách tham dự', assignedToName: 'LỘC PHÁT', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-025', title: 'Chia danh sách check-in', assignedToName: 'LỘC PHÁT - EMCAS', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-026', title: 'Phân công nhân sự đón tiếp', assignedToName: 'Anh Bửu - Thư', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-027', title: 'In chứng nhận theo danh sách cập nhật', assignedToName: 'C Như - Thư', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-028', title: 'Quà kỷ niệm chương (thiết kế in ấn)', assignedToName: 'Bác Khiêm - C Như', status: 'in_progress', progress: 50, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-029', title: 'MC Chương trình', assignedToName: 'Bs Bảo', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  { id: 'TSK-030', title: 'Phiên dịch', assignedToName: 'Bs Bảo - Bs Thế Anh', status: 'todo', progress: 0, deadline: '14/08/2026', notes: '' },
  
  // Trong Hội Nghị
  { id: 'TSK-031', title: 'Phân công nhân sự tại sự kiện (Đón tiếp, âm thanh ánh sáng...)', assignedToName: 'Anh Bửu - Thư + IT', status: 'todo', progress: 0, deadline: '12/09/2026', notes: '' },
  { id: 'TSK-032', title: 'Quà tặng BCV, đại biểu', assignedToName: 'Anh Bửu - Thư', status: 'todo', progress: 0, deadline: '12/09/2026', notes: '' },
  { id: 'TSK-033', title: 'QR đặt câu hỏi', assignedToName: 'Bs Như - Bs Bảo', status: 'todo', progress: 0, deadline: '10/09/2026', notes: '' },
  { id: 'TSK-034', title: 'Background màn LED sự kiện 2026', assignedToName: 'Marketing', status: 'todo', progress: 0, deadline: '12/09/2026', notes: '' },
  
  // Sau Hội Nghị
  { id: 'TSK-035', title: 'QR đánh giá sự kiện', assignedToName: 'Bs Như - Thư', status: 'todo', progress: 0, deadline: '12/09/2026', notes: '' },
  { id: 'TSK-036', title: 'Gửi thư cảm ơn đại biểu, báo cáo viên, hội thảo viên', assignedToName: 'Thư', status: 'todo', progress: 0, deadline: '18/09/2026', notes: '' },
  { id: 'TSK-037', title: 'Báo cáo kết quả tổ chức hội nghị', assignedToName: 'Thư', status: 'todo', progress: 0, deadline: '19/09/2026', notes: '' }
];

async function seedTasks() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // First delete all existing tasks to align exactly with spreadsheet
    console.log('🗑️ Deleting existing internal tasks...');
    await client.query('DELETE FROM public.internal_tasks;');
    console.log('✅ Deleted successfully!');

    // Insert 37 tasks
    console.log('⚡ Inserting 37 spreadsheet tasks...');
    for (const task of tasksData) {
      // Use the verified active admin account ID to avoid foreign key violations
      const assignedToId = '6eca6852-daa8-4630-b5cc-ea61b665655b'; // ADMIN SYSTEM

      const sql = `
        INSERT INTO public.internal_tasks (id, title, description, assigned_to_name, assigned_to_id, priority, status, deadline, progress, notes, detailed_content, checklist, comments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `;

      const values = [
        task.id,
        task.title,
        task.title, // Use title as description initially
        task.assignedToName,
        assignedToId,
        'medium',
        task.status,
        parseDate(task.deadline),
        task.progress,
        task.notes,
        '', // detailed_content empty
        '[]', // checklist JSON empty
        '[]'  // comments JSON empty
      ];

      await client.query(sql, values);
    }

    console.log('🎉 Successfully seeded 37 internal tasks from the spreadsheet image!');
  } catch (err) {
    console.error('❌ Error executing database seeding:', err.message || err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

seedTasks();
