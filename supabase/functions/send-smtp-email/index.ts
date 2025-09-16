import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

async function sendSMTPEmail(emailData: EmailRequest) {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error("SMTP credentials not configured");
  }

  // Create SMTP connection
  const conn = await Deno.connect({
    hostname: smtpHost,
    port: smtpPort,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function writeAndRead(data: string) {
    await conn.write(encoder.encode(data));
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    return decoder.decode(buffer.subarray(0, n || 0));
  }

  try {
    // SMTP handshake
    let response = await writeAndRead("");
    console.log("Initial:", response);

    // EHLO
    response = await writeAndRead(`EHLO ${smtpHost}\r\n`);
    console.log("EHLO:", response);

    // STARTTLS (if port 587)
    if (smtpPort === 587) {
      response = await writeAndRead("STARTTLS\r\n");
      console.log("STARTTLS:", response);
      
      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });
      conn.close();
      
      // Continue with TLS connection
      response = await writeAndRead(`EHLO ${smtpHost}\r\n`);
      console.log("EHLO TLS:", response);
    }

    // AUTH LOGIN
    response = await writeAndRead("AUTH LOGIN\r\n");
    console.log("AUTH:", response);

    // Username
    const username = btoa(smtpUser);
    response = await writeAndRead(`${username}\r\n`);
    console.log("Username:", response);

    // Password
    const password = btoa(smtpPassword);
    response = await writeAndRead(`${password}\r\n`);
    console.log("Password:", response);

    // MAIL FROM
    response = await writeAndRead(`MAIL FROM:<${emailData.from || smtpUser}>\r\n`);
    console.log("MAIL FROM:", response);

    // RCPT TO
    response = await writeAndRead(`RCPT TO:<${emailData.to}>\r\n`);
    console.log("RCPT TO:", response);

    // DATA
    response = await writeAndRead("DATA\r\n");
    console.log("DATA:", response);

    // Email content
    const emailContent = [
      `From: ${emailData.from || smtpUser}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `Content-Type: text/html; charset=utf-8`,
      "",
      emailData.html,
      "\r\n.\r\n"
    ].join("\r\n");

    response = await writeAndRead(emailContent);
    console.log("Content:", response);

    // QUIT
    response = await writeAndRead("QUIT\r\n");
    console.log("QUIT:", response);

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  } finally {
    conn.close();
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailRequest = await req.json();

    if (!emailData.to || !emailData.subject || !emailData.html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const result = await sendSMTPEmail(emailData);

    console.log("Email sent successfully to:", emailData.to);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-smtp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);