import { query } from "./db";

export async function subscribeToNewsletter(chatId: string, language: string = "ru") {
  try {
    await query(
      `INSERT INTO newsletter_subscribers (chat_id, language) 
       VALUES ($1, $2) 
       ON CONFLICT (chat_id) 
       DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP`,
      [chatId, language],
    );
    return { success: true };
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return { success: false, error };
  }
}

export async function unsubscribeFromNewsletter(chatId: string) {
  try {
    await query(
      `UPDATE newsletter_subscribers 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP 
       WHERE chat_id = $1`,
      [chatId],
    );
    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing from newsletter:", error);
    return { success: false, error };
  }
}

export async function getActiveSubscribers(language?: string) {
  try {
    const sql = language
      ? `SELECT chat_id, language FROM newsletter_subscribers WHERE is_active = true AND language = $1`
      : `SELECT chat_id, language FROM newsletter_subscribers WHERE is_active = true`;
    const params = language ? [language] : [];

    const result = await query(sql, params);
    return { success: true, subscribers: result.rows };
  } catch (error) {
    console.error("Error getting subscribers:", error);
    return { success: false, error, subscribers: [] };
  }
}

export async function createNewsletterCampaign(
  subject: string,
  message: string,
  language: string,
  createdBy: string,
) {
  try {
    const result = await query(
      `INSERT INTO newsletter_campaigns (subject, message, language, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [subject, message, language, createdBy],
    );
    return { success: true, campaignId: result.rows[0].id };
  } catch (error) {
    console.error("Error creating newsletter campaign:", error);
    return { success: false, error };
  }
}

export async function logNewsletterSent(
  campaignId: number,
  chatId: string,
  success: boolean,
  errorMessage?: string,
) {
  try {
    await query(
      `INSERT INTO newsletter_logs (campaign_id, chat_id, success, error_message) 
       VALUES ($1, $2, $3, $4)`,
      [campaignId, chatId, success, errorMessage || null],
    );
  } catch (error) {
    console.error("Error logging newsletter:", error);
  }
}



