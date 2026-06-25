const nodemailer = require('nodemailer');

/**
 * Connects to the user's configured SMTP server and sends a complete
 * summary report of all expenses along with a CSV spreadsheet backup.
 */
const sendExpenseListEmail = async (userEmail, userName, expenses) => {
  try {
    const host = (process.env.EMAIL_HOST || '').trim();
    const port = parseInt((process.env.EMAIL_PORT || '465').trim(), 10);
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const formattedTotal = totalAmount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
    });

    // 1. Generate HTML Table rows for recent expenses (up to 30 items)
    const recentExpenses = expenses.slice(0, 30);
    const tableRows = recentExpenses.map((exp, index) => {
      const formattedDate = new Date(exp.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const formattedAmt = Number(exp.amount).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
      });
      const rowBg = index % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)';
      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
          <td style="padding: 12px 16px; color: #f8fafc; font-weight: 500;">${exp.title}</td>
          <td style="padding: 12px 16px; color: #8b5cf6; font-weight: 600;">${exp.category}</td>
          <td style="padding: 12px 16px; color: #94a3b8; font-size: 13px;">${formattedDate}</td>
          <td style="padding: 12px 16px; color: #ef4444; font-weight: 700; text-align: right;">${formattedAmt}</td>
        </tr>
      `;
    }).join('');

    // 2. Generate CSV Content for spreadsheet attachment
    let csvContent = '\uFEFFID,Title,Amount,Category,Date,Source,Created At\n'; // added UTF-8 BOM
    expenses.forEach((exp) => {
      const id = exp._id.toString();
      const title = `"${exp.title.replace(/"/g, '""')}"`;
      const amount = exp.amount;
      const category = exp.category;
      const date = exp.date.toISOString().split('T')[0];
      const source = exp.source;
      const createdAt = exp.createdAt.toISOString();
      csvContent += `${id},${title},${amount},${category},${date},${source},${createdAt}\n`;
    });

    // Elegant HSL / Premium FinSync Dark Theme HTML Layout
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0a0f1d;
            color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            background-color: #0a0f1d;
            background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
            padding: 40px 20px;
          }
          .container {
            max-width: 620px;
            margin: 0 auto;
            background: #131a30;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 30px 40px;
            text-align: center;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .content {
            padding: 35px;
          }
          .welcome {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .stat-banner {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: table;
            width: 100%;
            box-sizing: border-box;
          }
          .stat-banner-cell {
            display: table-cell;
            text-align: center;
            width: 50%;
          }
          .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 22px;
            font-weight: 800;
            color: #f8fafc;
          }
          .table-title {
            font-size: 16px;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 12px;
            letter-spacing: -0.2px;
          }
          .expenses-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .expenses-table th {
            text-align: left;
            padding: 10px 16px;
            font-size: 11px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.07);
          }
          .footer {
            background: rgba(10, 15, 29, 0.4);
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
          }
          .footer p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.5;
          }
          .btn-dashboard {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">₹ FinSync</div>
              <div class="subtitle">Expense Sheet Report</div>
            </div>
            
            <div class="content">
              <div class="welcome">
                Hi ${userName},<br/>
                As requested, here is the export of your expense tracking sheet. We have also attached a complete 'CSV' file of your expense records to this email for use in spreadsheet editors like Microsoft Excel or Google Sheets.
              </div>
              
              <div class="stat-banner">
                <div class="stat-banner-cell" style="border-right: 1px solid rgba(255, 255, 255, 0.05); width: 50%;">
                  <div class="stat-label">Total Transactions</div>
                  <div class="stat-value" style="color: #6366f1;">${expenses.length}</div>
                </div>
                <div class="stat-banner-cell" style="width: 50%;">
                  <div class="stat-label">Total Outflow</div>
                  <div class="stat-value" style="color: #ef4444;">${formattedTotal}</div>
                </div>
              </div>
              
              <div class="table-title">Recent Transactions</div>
              <table class="expenses-table">
                <thead>
                  <tr>
                    <th style="text-align: left;">Merchant</th>
                    <th style="text-align: left;">Category</th>
                    <th style="text-align: left;">Date</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>

              ${expenses.length > 30 ? `
                <div style="text-align: center; font-size: 13px; color: #64748b; margin-bottom: 25px; font-style: italic;">
                  Showing the 30 most recent transactions. All ${expenses.length} records are included in the attached CSV file.
                </div>
              ` : ''}
              
              <div style="text-align: center; margin-top: 25px;">
                <a href="http://localhost:5173" class="btn-dashboard">Go to Wallet Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Smart Finance, Made Simple.</p>
              <p style="margin-top: 5px;">FinSync &copy; 2026. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"FinSync Alerts" <${process.env.EMAIL_USER}>`,
      to: `"${userName}" <${userEmail}>`,
      subject: `📊 FinSync: Your Expense Sheet Report (${expenses.length} items)`,
      text: `Hi ${userName},\n\nAs requested, here is the export of your expense sheet. We have attached the complete CSV sheet containing all your ${expenses.length} transaction logs (totaling ${formattedTotal}) to this email.\n\nOpen FinSync Dashboard: http://localhost:5173`,
      html: htmlContent,
      attachments: [
        {
          filename: `expenses_report_${new Date().toISOString().split('T')[0]}.csv`,
          content: csvContent,
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Report Email Sent] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending expense list email:', error.message);
    throw error;
  }
};

const sendOtpEmail = async (userEmail, userName, otp) => {
  // Always log to console first for convenience during local development/testing!
  console.log(`\n==========================================`);
  console.log(`🔑 [OTP VERIFICATION CODE FOR ${userEmail}]`);
  console.log(`   NAME: ${userName}`);
  console.log(`   OTP CODE: ${otp}`);
  console.log(`==========================================\n`);

  try {
    const host = (process.env.EMAIL_HOST || '').trim();
    const port = parseInt((process.env.EMAIL_PORT || '465').trim(), 10);
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();

    if (!host || !user || !pass) {
      console.warn('⚠️ SMTP email configuration is missing or incomplete in .env. Skipping actual email dispatch.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0a0f1d;
            color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            background-color: #0a0f1d;
            background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
            padding: 40px 20px;
          }
          .container {
            max-width: 520px;
            margin: 0 auto;
            background: #131a30;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 30px 40px;
            text-align: center;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .content {
            padding: 35px;
            text-align: center;
          }
          .welcome {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 25px;
            text-align: left;
          }
          .otp-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            display: inline-block;
            width: 80%;
            box-sizing: border-box;
          }
          .otp-code {
            font-size: 38px;
            font-weight: 800;
            color: #8b5cf6;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .otp-expiry {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          .footer {
            background: rgba(10, 15, 29, 0.4);
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
          }
          .footer p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">₹ FinSync</div>
              <div class="subtitle">Email Verification</div>
            </div>
            
            <div class="content">
              <div class="welcome">
                Hi ${userName},<br/><br/>
                Thank you for choosing FinSync! To complete your registration and secure your smart wallet, please verify your email address using the one-time password (OTP) below:
              </div>
              
              <div class="otp-card">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 600;">Verification Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">This code is valid for 10 minutes. Do not share it with anyone.</div>
              </div>
              
              <div style="color: #94a3b8; font-size: 14px; text-align: left; line-height: 1.6; margin-top: 10px;">
                If you did not initiate this request, you can safely ignore this email.
              </div>
            </div>
            
            <div class="footer">
              <p>Smart Finance, Made Simple.</p>
              <p style="margin-top: 5px;">FinSync &copy; 2026. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"FinSync Accounts" <${process.env.EMAIL_USER}>`,
      to: `"${userName}" <${userEmail}>`,
      subject: `🔑 FinSync Verification Code: ${otp}`,
      text: `Hi ${userName},\n\nThank you for choosing FinSync! Use the verification code below to complete your registration:\n\nVerification Code: ${otp}\n\nThis code is valid for 10 minutes.\n\nSmart Finance, Made Simple.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[OTP Email Sent] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    // Do not let email failure crash registration, print code clearly
    console.log(`⚠️ SMTP Error: Code was not emailed. Copy it from the console above!`);
  }
};

const sendResetPasswordEmail = async (userEmail, userName, otp) => {
  console.log(`\n==========================================`);
  console.log(`🔑 [PASSWORD RESET OTP FOR ${userEmail}]`);
  console.log(`   NAME: ${userName}`);
  console.log(`   OTP CODE: ${otp}`);
  console.log(`==========================================\n`);

  try {
    const host = (process.env.EMAIL_HOST || '').trim();
    const port = parseInt((process.env.EMAIL_PORT || '465').trim(), 10);
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();

    if (!host || !user || !pass) {
      console.warn('⚠️ SMTP email configuration is missing or incomplete in .env. Skipping actual email dispatch.');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0a0f1d;
            color: #f8fafc;
            margin: 0;
            padding: 0;
          }
          .email-wrapper {
            background-color: #0a0f1d;
            background-image: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%);
            padding: 40px 20px;
          }
          .container {
            max-width: 520px;
            margin: 0 auto;
            background: #131a30;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
            padding: 30px 40px;
            text-align: center;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
          }
          .subtitle {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.85);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .content {
            padding: 35px;
            text-align: center;
          }
          .welcome {
            font-size: 15px;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 25px;
            text-align: left;
          }
          .otp-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            display: inline-block;
            width: 80%;
            box-sizing: border-box;
          }
          .otp-code {
            font-size: 38px;
            font-weight: 800;
            color: #f43f5e;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .otp-expiry {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          .footer {
            background: rgba(10, 15, 29, 0.4);
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.04);
          }
          .footer p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">₹ FinSync</div>
              <div class="subtitle">Reset Password</div>
            </div>
            
            <div class="content">
              <div class="welcome">
                Hi ${userName},<br/><br/>
                We received a request to reset your password. Use the verification OTP code below to complete the reset process:
              </div>
              
              <div class="otp-card">
                <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; font-weight: 600;">Reset Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-expiry">This code is valid for 10 minutes. Do not share it with anyone.</div>
              </div>
              
              <div style="color: #94a3b8; font-size: 14px; text-align: left; line-height: 1.6; margin-top: 10px;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </div>
            </div>
            
            <div class="footer">
              <p>Smart Finance, Made Simple.</p>
              <p style="margin-top: 5px;">FinSync &copy; 2026. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"FinSync Accounts" <${process.env.EMAIL_USER}>`,
      to: `"${userName}" <${userEmail}>`,
      subject: `🔑 FinSync Password Reset OTP: ${otp}`,
      text: `Hi ${userName},\n\nWe received a request to reset your password. Use the code below to reset it:\n\nReset Code: ${otp}\n\nThis code is valid for 10 minutes.\n\nSmart Finance, Made Simple.`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Reset Password Email Sent] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending reset password email:', error.message);
    console.log(`⚠️ SMTP Error: Reset Code was not emailed. Copy it from the console above!`);
  }
};

module.exports = {
  sendExpenseListEmail,
  sendOtpEmail,
  sendResetPasswordEmail
};
