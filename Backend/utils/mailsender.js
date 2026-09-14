const { Resend } = require("resend");
require("dotenv").config();

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const mailsender = async (email, title, body) => {
  try {
    if (!resend) {
      throw new Error("RESEND_API_KEY is not configured in environment variables.");
    }

    const defaultFrom = "MediConnect <onboarding@resend.dev>";
    const fromAddress = process.env.MAIL_FROM?.trim() || defaultFrom;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: title,
      html: body,
    });

    if (error) {
      console.error("Resend delivery failed:", error);
      throw new Error(error.message || "Email sending failed");
    }

    console.log("Email sent successfully via Resend. ID:", data?.id);
    return data;
  } catch (error) {
    console.error("Error sending mail:", error.message || error);
    throw error;
  }
};

module.exports = mailsender;