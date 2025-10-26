import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createInternalRequest } from "@/lib/database/queries";

const resend = new Resend(process.env.RESEND_API_KEY);

interface RequestFormData {
  requester: string;
  department: string;
  requestType: string;
  description: string;
  priority: "low" | "normal" | "high";
}

export async function POST(request: NextRequest) {
  try {
    const data: RequestFormData = await request.json();

    // Validate required fields
    if (!data.requester || !data.department || !data.requestType || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate request ID
    const requestId = `IR-${Date.now()}`;

    // Save to database
    try {
      await createInternalRequest({
        id: requestId,
        requester: data.requester,
        department: data.department,
        request_type: data.requestType,
        priority: data.priority,
        description: data.description,
        // Note: email and wallet_address are optional for internal requests
        email: data.requester.includes("@") ? data.requester : undefined,
      });
    } catch (dbError) {
      console.error("Error saving to database:", dbError);
      return NextResponse.json({ error: "Failed to save request to database" }, { status: 500 });
    }

    // Get environment variables
    const recipientEmail = process.env.RECIPIENT_EMAIL || "treasury@company.io";
    const senderEmail = process.env.SENDER_EMAIL || "noreply@company.io";

    // Map request types to readable labels
    const requestTypeMap: Record<string, string> = {
      topUp: "Token Top-up",
      withdraw: "Token Withdrawal",
      balance: "Balance Review",
      report: "Report Request",
    };

    // Map departments to readable labels
    const departmentMap: Record<string, string> = {
      finance: "Finance Department",
      aml: "AML/KYC Department",
      investment: "Investment Team",
      support: "Customer Support",
    };

    // Format email content
    const emailSubject = `[${data.priority.toUpperCase()}] ${requestTypeMap[data.requestType] || data.requestType} - ${data.requester}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #667eea; display: block; margin-bottom: 5px; }
            .value { padding: 10px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
            .priority-badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-low { background: #d4edda; color: #155724; }
            .priority-normal { background: #fff3cd; color: #856404; }
            .priority-high { background: #f8d7da; color: #721c24; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Internal Token Operation Request</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Requester:</span>
                <div class="value">${data.requester}</div>
              </div>
              <div class="field">
                <span class="label">Department:</span>
                <div class="value">${departmentMap[data.department] || data.department}</div>
              </div>
              <div class="field">
                <span class="label">Request Type:</span>
                <div class="value">${requestTypeMap[data.requestType] || data.requestType}</div>
              </div>
              <div class="field">
                <span class="label">Priority:</span>
                <div class="value">
                  <span class="priority-badge priority-${data.priority}">
                    ${data.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="field">
                <span class="label">Description:</span>
                <div class="value" style="white-space: pre-wrap;">${data.description}</div>
              </div>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                This request was submitted through the internal dashboard at ${new Date().toLocaleString()}.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: senderEmail,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: emailData?.id }, { status: 200 });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
