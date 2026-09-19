exports.getOTPEmailTemplate = (otp) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your MediConnect Verification Code</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .otp-box { font-size: 28px !important; letter-spacing: 6px !important; padding: 16px 8px !important; }
      .stack-column { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your MediConnect verification code expires in 5 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(20, 40, 60, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); padding: 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px; height:36px; background-color:#ffffff; border-radius:9px; text-align:center; vertical-align:middle;">
                          <span style="font-size:18px; line-height:36px;">🩺</span>
                        </td>
                        <td style="padding-left:12px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; color:#ffffff; letter-spacing:0.2px;">MediConnect</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 44px 48px 20px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:#0f766e; letter-spacing:1.5px; text-transform:uppercase;">Verify it's you</p>
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:32px; color:#0f172a; font-weight:700;">Your one-time verification code</h1>
              <p style="margin:0 0 28px 0; font-size:15px; line-height:24px; color:#475569;">
                Use the code below to complete your registration for MediConnect. This code is valid for the next <strong style="color:#0f172a;">5 minutes</strong> and can only be used once.
              </p>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 0 48px 32px 48px; font-family: Arial, Helvetica, sans-serif;" align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" class="otp-box" style="background-color:#f0fdfa; border: 1.5px dashed #14b8a6; border-radius: 12px; padding: 22px 12px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #0f766e;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 0 48px 8px 48px; font-family: Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px; font-size:13px; line-height:20px; color:#92400e;">
                    ⏱️ <strong>Expires in 5 minutes.</strong> Didn't request this code? You can safely ignore this email — no changes will be made to your account.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 32px 48px 0 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 24px 48px 40px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0; font-size:13px; line-height:20px; color:#94a3b8;">
                For your security, never share this code with anyone — not even MediConnect support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding: 28px 48px; font-family: Arial, Helvetica, sans-serif;" align="center">
              <p style="margin:0 0 6px 0; font-size:12px; color:#94a3b8;">© 2026 MediConnect. All rights reserved.</p>
              <p style="margin:0; font-size:12px; color:#cbd5e1;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

exports.getPasswordResetEmailTemplate = (otp) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your MediConnect Password</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .otp-box { font-size: 28px !important; letter-spacing: 6px !important; padding: 16px 8px !important; }
      .stack-column { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your password reset code expires in 5 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(20, 40, 60, 0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px; height:36px; background-color:#ffffff; border-radius:9px; text-align:center; vertical-align:middle;">
                          <span style="font-size:18px; line-height:36px;">🔒</span>
                        </td>
                        <td style="padding-left:12px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; color:#ffffff; letter-spacing:0.2px;">MediConnect Security</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 44px 48px 20px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:#0284c7; letter-spacing:1.5px; text-transform:uppercase;">Password Reset</p>
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:32px; color:#0f172a; font-weight:700;">Reset your account password</h1>
              <p style="margin:0 0 28px 0; font-size:15px; line-height:24px; color:#475569;">
                We received a request to reset your password. Use the verification code below to authorize a new password for your MediConnect account. This code is valid for <strong style="color:#0f172a;">5 minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 0 48px 32px 48px; font-family: Arial, Helvetica, sans-serif;" align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" class="otp-box" style="background-color:#f0f9ff; border: 1.5px dashed #0284c7; border-radius: 12px; padding: 22px 12px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #0369a1;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 0 48px 8px 48px; font-family: Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb; border-radius:10px;">
                <tr>
                  <td style="padding:14px 18px; font-size:13px; line-height:20px; color:#92400e;">
                    ⚠️ <strong>Did not request this?</strong> If you didn't make this request, please ignore this email. Your current password will remain unchanged and secure.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 32px 48px 0 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e2e8f0; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="stack-column" style="padding: 24px 48px 40px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0; font-size:13px; line-height:20px; color:#94a3b8;">
                Never share this OTP with anyone. MediConnect will never contact you asking for your password or verification code.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding: 28px 48px; font-family: Arial, Helvetica, sans-serif;" align="center">
              <p style="margin:0 0 6px 0; font-size:12px; color:#94a3b8;">© 2026 MediConnect. All rights reserved.</p>
              <p style="margin:0; font-size:12px; color:#cbd5e1;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

exports.getPaymentSuccessEmailTemplate = ({
  patientName,
  doctorName,
  doctorSpecialization,
  slotDate,
  slotTime,
  amount,
  paymentId,
  orderId,
  appointmentId,
}) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Payment Successful & Appointment Confirmed</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .stack-column { padding: 24px 20px !important; }
      .ledger-cell { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your payment of ₹${amount} was successful. Appointment confirmed with Dr. ${doctorName}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 40px 12px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(20, 40, 60, 0.08);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f3e36 0%, #185a4f 100%); padding: 32px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:40px; height:40px; background-color:rgba(255,255,255,0.15); border-radius:10px; text-align:center; vertical-align:middle;">
                          <span style="font-size:22px; line-height:40px;">✅</span>
                        </td>
                        <td style="padding-left:14px;">
                          <span style="font-family: Arial, Helvetica, sans-serif; font-size:20px; font-weight:700; color:#ffffff; letter-spacing:0.3px;">MediConnect</span>
                          <span style="display:block; font-family: Arial, Helvetica, sans-serif; font-size:12px; color:#a7f3d0; margin-top:2px;">Booking Confirmation</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="stack-column" style="padding: 40px 48px 16px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0 0 6px 0; font-size:13px; font-weight:700; color:#059669; letter-spacing:1.5px; text-transform:uppercase;">Payment Successful</p>
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:32px; color:#111827; font-weight:700;">Appointment Confirmed!</h1>
              <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#4b5563;">
                Hello <strong>${patientName}</strong>,<br>
                We have received your payment of <strong style="color:#0f3e36;">₹${amount}</strong>. Your telehealth consultation has been confirmed with <strong>Dr. ${doctorName}</strong>.
              </p>
            </td>
          </tr>

          <!-- Appointment & Payment Details Card -->
          <tr>
            <td class="stack-column" style="padding: 0 48px 24px 48px; font-family: Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; overflow:hidden;">
                <tr>
                  <td style="padding: 16px 20px; background-color:#f3f4f6; border-bottom: 1px solid #e5e7eb;">
                    <strong style="font-size:14px; color:#111827; text-transform:uppercase; letter-spacing:0.8px;">Consultation Details</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; border-bottom: 1px dashed #e5e7eb;">Doctor</td>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px dashed #e5e7eb;">Dr. ${doctorName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; border-bottom: 1px dashed #e5e7eb;">Specialization</td>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px dashed #e5e7eb;">${doctorSpecialization}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; border-bottom: 1px dashed #e5e7eb;">Date</td>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #111827; text-align: right; border-bottom: 1px dashed #e5e7eb;">${slotDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; border-bottom: 1px dashed #e5e7eb;">Time Slot</td>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: #0f3e36; text-align: right; border-bottom: 1px dashed #e5e7eb;">${slotTime}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 14px; color: #6b7280; border-bottom: 1px dashed #e5e7eb;">Amount Paid</td>
                        <td style="padding: 10px 0; font-size: 15px; font-weight: 700; color: #059669; text-align: right; border-bottom: 1px dashed #e5e7eb;">₹${amount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 13px; color: #9ca3af; border-bottom: 1px dashed #e5e7eb;">Payment ID</td>
                        <td style="padding: 10px 0; font-family: monospace; font-size: 12px; color: #4b5563; text-align: right; border-bottom: 1px dashed #e5e7eb;">${paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; font-size: 13px; color: #9ca3af;">Appointment ID</td>
                        <td style="padding: 10px 0; font-family: monospace; font-size: 12px; color: #4b5563; text-align: right;">${appointmentId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Consultation Room Instructions Box -->
          <tr>
            <td class="stack-column" style="padding: 0 48px 24px 48px; font-family: Arial, Helvetica, sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5; border-left: 4px solid #059669; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; font-size: 14px; line-height: 22px; color: #065f46;">
                    📹 <strong>How to Join Your Video Consultation:</strong><br>
                    Log in to your MediConnect dashboard and go to your appointments. Your private video room will unlock <strong>30 minutes before</strong> your scheduled time (${slotTime}).
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="stack-column" style="padding: 0 48px 0 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="border-top:1px solid #e5e7eb; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Support Note -->
          <tr>
            <td class="stack-column" style="padding: 24px 48px 36px 48px; font-family: Arial, Helvetica, sans-serif;">
              <p style="margin:0; font-size:13px; line-height:20px; color:#6b7280;">
                Need to reschedule or have questions? You can manage your appointments anytime from your MediConnect account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc; padding: 28px 48px; font-family: Arial, Helvetica, sans-serif;" align="center">
              <p style="margin:0 0 6px 0; font-size:12px; color:#94a3b8;">© 2026 MediConnect Telehealth Platform. All rights reserved.</p>
              <p style="margin:0; font-size:12px; color:#cbd5e1;">This is an automated booking confirmation. Please save it for your records.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
