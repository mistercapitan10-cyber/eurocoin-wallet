import { config } from "dotenv";
import { resolve } from "path";
import { Resend } from "resend";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function testEmailSend() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.SENDER_EMAIL ?? "noreply@resend.dev";
  const testEmail = process.env.TEST_EMAIL ?? "peterbaikov12@gmail.com";

  if (!resendApiKey) {
    console.error("❌ RESEND_API_KEY is not set");
    process.exit(1);
  }

  console.log("📧 Testing email send...");
  console.log("From:", fromAddress);
  console.log("To:", testEmail);
  console.log("API Key:", resendApiKey.substring(0, 10) + "...");

  const resend = new Resend(resendApiKey);

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: testEmail,
      subject: "Test Email from EuroCoin Wallet",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify Resend configuration.</p>
        <p>If you received this, email sending is working correctly.</p>
      `,
      text: "This is a test email to verify Resend configuration.",
    });

    if (result.error) {
      console.error("❌ Error sending email:", result.error);
      console.error("Error details:", JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log("✅ Email sent successfully!");
    console.log("Email ID:", result.data?.id);
    console.log("\n📬 Please check your inbox:", testEmail);
    console.log("⏰ Note: It may take a few minutes to arrive");
  } catch (error) {
    console.error("❌ Failed to send email:");
    console.error(error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

testEmailSend();
