import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'escalavincenico28@gmail.com',
    pass: 'dhhp ayra vlcm ncpw',
  },
});

async function main() {
  const res = await transporter.sendMail({
    from: '"QC Flow Guardian" <escalavincenico28@gmail.com>',
    to: 'escalavincenico555@gmail.com',
    replyTo: 'escalavincenico28@gmail.com',
    subject: 'QC Flow Guardian - Official Settlement Notification',
    text: `Hello,\n\nThis is a notification from QC Flow Guardian for your traffic citation settlement.\n\nCitation: QC-2026-16583\nPlate Number: NBA-1121\nStatus: Cleared\n\nThank you,\nQuezon City DPOS`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0b4f8a;">QC Flow Guardian - Official Settlement Notification</h2>
        <p>Hello,</p>
        <p>This is a notification confirming the traffic citation settlement for vehicle <strong>NBA-1121</strong>.</p>
        <table style="border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 6px 12px; border: 1px solid #ddd; background: #f9f9f9;">Citation:</td><td style="padding: 6px 12px; border: 1px solid #ddd;">QC-2026-16583</td></tr>
          <tr><td style="padding: 6px 12px; border: 1px solid #ddd; background: #f9f9f9;">Plate:</td><td style="padding: 6px 12px; border: 1px solid #ddd;">NBA-1121</td></tr>
          <tr><td style="padding: 6px 12px; border: 1px solid #ddd; background: #f9f9f9;">Status:</td><td style="padding: 6px 12px; border: 1px solid #ddd; color: green; font-weight: bold;">CLEARED</td></tr>
        </table>
        <p>Thank you,<br/>Quezon City DPOS</p>
      </div>
    `,
  });
  console.log('Successfully dispatched:', res);
}

main().catch(console.error);
