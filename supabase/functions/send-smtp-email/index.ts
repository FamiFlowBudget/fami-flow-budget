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

// Función simple de envío de email usando fetch para servicios SMTP HTTP
async function sendEmailViaSMTP(emailData: EmailRequest) {
  const smtpHost = Deno.env.get("SMTP_HOST");
  const smtpPort = Deno.env.get("SMTP_PORT");
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

  // Por ahora, simulamos el envío exitoso y logueamos la información
  console.log("Simulating email send:", {
    to: emailData.to,
    subject: emailData.subject,
    from: emailData.from || smtpUser,
    htmlLength: emailData.html.length
  });

  // TODO: Implementar envío real de SMTP aquí
  // Por ahora retornamos éxito para probar el flujo
  return { 
    success: true, 
    message: "Email simulation successful",
    details: {
      to: emailData.to,
      subject: emailData.subject,
      smtp_host: smtpHost,
      smtp_user: smtpUser
    }
  };
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