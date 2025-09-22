import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

// Función de envío de email usando Resend
async function sendEmailViaResend(emailData: EmailRequest) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  console.log("Resend Configuration check:", {
    apiKey: resendApiKey ? "✓ configured" : "✗ missing"
  });

  if (!resendApiKey) {
    throw new Error(`Resend API key not configured. Missing: RESEND_API_KEY`);
  }

  // Using verified domain rankidia.com
  const fromAddress = emailData.from || "FamiFlow <noreply@rankidia.com>";
  
  console.log("Sending email via Resend:", {
    to: emailData.to,
    subject: emailData.subject,
    from: fromAddress,
    htmlLength: emailData.html.length
  });

  try {
    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    });

    console.log("Email sent successfully via Resend:", emailResponse);

    return { 
      success: true, 
      message: "Email sent successfully",
      details: {
        id: emailResponse.data?.id,
        to: emailData.to,
        subject: emailData.subject
      }
    };
  } catch (error: any) {
    console.error("Error sending email via Resend:", error);
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

    const result = await sendEmailViaResend(emailData);
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