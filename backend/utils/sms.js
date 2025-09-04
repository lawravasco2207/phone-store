// Lightweight SMS sender with Twilio support and safe console fallback
import axios from 'axios';

function normalizePhone(phone) {
  if (!phone) return phone;
  let p = ('' + phone).replace(/\D/g, '');
  // If Kenyan number starting with 0, convert to 2547xxxxxxx
  if (p.startsWith('0')) p = '254' + p.substring(1);
  if (!p.startsWith('254')) p = '254' + p; // best effort default
  return `+${p}`;
}

export async function sendSMS(to, body) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    const normalizedTo = normalizePhone(to);

    if (!accountSid || !authToken || !from) {
      console.log('[SMS:DEV] Would send SMS', { to: normalizedTo, from, body });
      return { success: true, dev: true };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('From', from);
    params.append('To', normalizedTo);
    params.append('Body', body);

    const res = await axios.post(url, params, {
      auth: { username: accountSid, password: authToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return { success: true, sid: res.data.sid };
  } catch (err) {
    console.error('Failed to send SMS:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}

export default { sendSMS };
