import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let name = "PARS 2026 - Hội Nghị Khoa Học Thẩm Mỹ";
    let shortName = "PARS 2026";
    let description = "Hệ thống quản lý Hội Nghị Khoa Học Thẩm Mỹ Quốc Tế Thường Niên PARS 2026";
    let logoUrl = "/icons/icon-512.png";
    let themeColor = "#3d57a6";
    let backgroundColor = "#fbf8f5";

    // Fetch from Supabase
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const { data, error } = await supabase
          .from('business_config')
          .select('*')
          .eq('id', 'default')
          .maybeSingle();

        if (data && !error) {
          name = data.pwa_name || data.event_name || name;
          shortName = data.pwa_short_name || data.event_name?.substring(0, 15) || shortName;
          description = data.pwa_description || data.event_name || description;
          logoUrl = data.pwa_logo_url || logoUrl;
          themeColor = data.pwa_theme_color || themeColor;
          backgroundColor = data.pwa_background_color || backgroundColor;
        } else if (error) {
          console.error('Lỗi truy vấn business_config từ Supabase:', error.message);
        }
      } catch (dbErr: any) {
        console.error('Lỗi kết nối Supabase khi lấy cấu hình manifest:', dbErr.message || dbErr);
      }
    }

    const manifest = {
      name: name,
      short_name: shortName,
      description: description,
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait-primary",
      theme_color: themeColor,
      background_color: backgroundColor,
      lang: "vi",
      dir: "ltr",
      categories: ["medical", "events", "productivity"],
      icons: [
        {
          src: logoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: logoUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: logoUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ],
      shortcuts: [
        {
          name: "Check-in đại biểu",
          short_name: "Check-in",
          description: "Quét mã QR check-in đại biểu",
          url: "/?view=checkin",
          icons: [
            {
              src: logoUrl,
              sizes: "96x96"
            }
          ]
        },
        {
          name: "Danh sách đại biểu",
          short_name: "Đại biểu",
          description: "Xem danh sách đại biểu đã đăng ký",
          url: "/?view=attendees",
          icons: [
            {
              src: logoUrl,
              sizes: "96x96"
            }
          ]
        }
      ],
      prefer_related_applications: false
    };

    // Cache manifest for 60 seconds
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(manifest);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
