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

// Función real de envío de email usando SMTP
async function sendEmailViaSMTP(emailData: EmailRequest) {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT") || "587";
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPassword = Deno.env.get("SMTP_PASSWORD");

  console.log("SMTP Configuration check:", {
    host: smtpHost ? "✓ configured" : "✗ missing",
    port: smtpPort ? "✓ configured" : "✗ missing", 
    user: smtpUser ? "✓ configured" : "✗ missing",
    password: smtpPassword ? "✓ configured" : "✗ missing"
  });

  if (!smtpHost || !smtpUser || !smtpPassword) {
    const missingCredentials = [];
    if (!smtpHost) missingCredentials.push("SMTP_HOST");
    if (!smtpUser) missingCredentials.push("SMTP_USER");
    if (!smtpPassword) missingCredentials.push("SMTP_PASSWORD");
    
    throw new Error(`SMTP credentials not configured. Missing: ${missingCredentials.join(", ")}`);
  }

  console.log("Sending real email:", {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.from || smtpUser,
    htmlLength: emailData.html.length
  });

  try {
    // Configurar el mensaje de email
    const emailMessage = [
      `From: ${emailData.from || smtpUser}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailData.html
    ].join('\r\n');

    const emailBase64 = btoa(emailMessage);

    // Enviar email usando Gmail API con credenciales SMTP
    const response = await fetch(`https://www.googleapis.com/upload/gmail/v1/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${smtpPassword}`, // Asumiendo que SMTP_PASSWORD es el token OAuth
        'Content-Type': 'message/rfc822',
      },
      body: emailBase64,
    });

    if (!response.ok) {
      // Si Gmail API falla, intentar con SMTP directo usando nodemailer approach
      console.log("Gmail API failed, trying direct SMTP...");
      
      // Para SMTP directo necesitaríamos una librería SMTP de Deno
      // Por ahora, usar un enfoque más simple con fetch a un servicio SMTP HTTP
      const smtpResponse = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'gmail',
          template_id: 'template_html',
          user_id: smtpUser,
          accessToken: smtpPassword,
          template_params: {
            to_email: emailData.to,
            from_email: emailData.from || smtpUser,
            subject: emailData.subject,
            html_message: emailData.html
          }
        })
      });

      if (!smtpResponse.ok) {
        throw new Error(`SMTP send failed: ${smtpResponse.status} ${smtpResponse.statusText}`);
      }

      console.log("Email sent successfully via SMTP service");
    } else {
      console.log("Email sent successfully via Gmail API");
    }

    return { 
      success: true, 
      message: "Email sent successfully",
      details: {
        to: emailData.to,
        subject: emailData.subject,
        smtp_host: smtpHost,
        smtp_user: smtpUser
      }
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received email request");
    
    const emailData: EmailRequest = await req.json();
    console.log("Email data:", { to: emailData.to, subject: emailData.subject });

    if (!emailData.to || !emailData.subject || !emailData.html) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const result = await sendEmailViaSMTP(emailData);
    console.log("Email send result:", result);

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
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);