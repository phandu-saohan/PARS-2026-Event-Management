/**
 * CLOUDFLARE WORKER TEMPLATE FOR BULK EMAIL SENDING
 * ------------------------------------------------
 * This worker acts as an API gateway for sending bulk emails.
 * It supports two outbound methods:
 *   1. Mailchannels API (Free & built-in native Cloudflare Worker email sending).
 *   2. Gmail API / SMTP (Custom relay).
 *
 * How to deploy:
 *   1. Create a new Cloudflare Worker in your Cloudflare Dashboard.
 *   2. Paste this code into the worker editor.
 *   3. (Optional) Set the API_TOKEN environment variable in the Worker Settings for security.
 *   4. Deploy and copy the worker .dev URL into the PARS Event Settings Panel.
 */

const API_TOKEN = "your-custom-secure-token-here"; // Set this or use wrangler secrets

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Only POST requests are allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 1. Authenticate Request
    const authHeader = request.headers.get("Authorization");
    const expectedToken = env.API_TOKEN || API_TOKEN;
    if (expectedToken && expectedToken !== "your-custom-secure-token-here") {
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
      if (token !== expectedToken) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized access" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 2. Parse Request Body
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: "Malformed JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const { from, to, subject, html } = body;
    if (!from || !to || !html) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields (from, to, html)" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    try {
      // METHOD A: Send via Mailchannels (Native Cloudflare outbound - Free & Recommended)
      const mailchannelsResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: to }],
            },
          ],
          from: {
            email: from,
            name: "Ban Tổ Chức PARS & VSAPS 2026",
          },
          subject: subject || "Thông báo từ Ban Tổ Chức",
          content: [
            {
              type: "text/html",
              value: html,
            },
          ],
        }),
      });

      const resText = await mailchannelsResponse.text();
      if (mailchannelsResponse.ok) {
        return new Response(JSON.stringify({
          success: true,
          id: `cf-mc-${Date.now()}`,
          message: "Email forwarded successfully"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: `Mailchannels returned error: ${resText}`
        }), {
          status: mailchannelsResponse.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      /* 
      // METHOD B: Send via Gmail SMTP / Custom Relay (Alternative)
      // To run SMTP directly in workers, you can connect to Google SMTP servers using TCP sockets:
      // const socket = connect({ hostname: "smtp.gmail.com", port: 465 });
      // (Requires SMTP protocol handshake handling, recommended to use Mailchannels as detailed above for simplicity).
      */

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message || "Failed to route email"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
