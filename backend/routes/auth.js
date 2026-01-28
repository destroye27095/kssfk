const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const paymentsFile = path.join(__dirname, '../../data');

const otpsFile = path.join(__dirname, '../../data/otps.json');

function readJson(filePath){
  try { return JSON.parse(fs.readFileSync(filePath,'utf8')); } catch(e){ return []; }
}
function saveJson(filePath, data){
  try{ fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return true; }catch(e){ return false; }
}

// POST /api/auth/send-otp
router.post('/send-otp', (req, res) => {
  const { phone } = req.body || {};
  if(!phone) return res.status(400).json({ error: 'phone required' });
  const code = Math.floor(100000 + Math.random()*900000).toString();
  const otps = readJson(otpsFile);
  const record = { phone, code, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now()+5*60000).toISOString() };
  otps.push(record);
  saveJson(otpsFile, otps);
  // In production, send SMS via provider. Here return masked response for demo
  res.json({ status: 'sent', phone, expiresIn: 300, demoCode: code });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phone, code } = req.body || {};
  if(!phone || !code) return res.status(400).json({ error: 'phone and code required' });
  const otps = readJson(otpsFile);
  const idx = otps.findIndex(o => o.phone === phone && o.code === String(code));
  if(idx === -1) return res.status(400).json({ error: 'invalid code' });
  const rec = otps[idx];
  // simple expiry check
  if(new Date(rec.expiresAt) < new Date()) return res.status(400).json({ error: 'code expired' });
  // success: create demo token
  const token = `demo-token-${Date.now()}`;
  // remove used OTP
  otps.splice(idx,1);
  saveJson(otpsFile, otps);
  res.json({ status: 'verified', token, user: { phone } });
});

// GET /api/auth/google - returns OAuth URL or stub
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || null;
  const redirectUri = process.env.GOOGLE_CALLBACK || 'http://localhost:5000/api/auth/google/callback';
  if(!clientId) return res.json({ message: 'Configure GOOGLE_CLIENT_ID to enable real Google OAuth', url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=<YOUR_CLIENT_ID>&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile` });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
  res.json({ url });
});

// GET /api/auth/google/callback (stub)
router.get('/google/callback', (req, res) => {
  const code = req.query.code;
  if(!code) return res.status(400).send('Missing code');
  // In production exchange code for token. Here we return demo page.
  res.send(`<html><body><h3>Google OAuth Demo</h3><p>Received code: ${code}</p><p>Close this window and return to the app.</p></body></html>`);
});

module.exports = router;
