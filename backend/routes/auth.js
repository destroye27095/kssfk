const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const paymentsFile = path.join(__dirname, '../../data');

const otpsFile = path.join(__dirname, '../../data/otps.json');
const usersFile = path.join(__dirname, '../../data/users.json');

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

  // In production, send SMS using configured provider (Twilio, Africa's Talking, etc.).
  // For safety do NOT echo OTP in responses unless explicitly enabled via
  // environment variable RETURN_OTP_IN_RESPONSE=true (not recommended).
  const resp = { status: 'sent', phone, expiresIn: 300 };
  if(process.env.RETURN_OTP_IN_RESPONSE === 'true') resp.demoCode = code;
  res.json(resp);
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
  // remove used OTP
  otps.splice(idx,1);
  saveJson(otpsFile, otps);

  // create/find user
  const users = readJson(usersFile);
  let user = users.find(u => u.phone === phone);
  const isNew = !user;
  if(isNew){
    user = { id: `user-${Date.now()}`, phone, acceptedTerms: false, createdAt: new Date().toISOString() };
    users.push(user);
    saveJson(usersFile, users);
  }

  // issue JWT if configured
  let token = null;
  try{
    const jwtSecret = process.env.JWT_SECRET || process.env.SECRET;
    if(jwtSecret){
      const jwt = require('jsonwebtoken');
      token = jwt.sign({ sub: user.id, phone: user.phone }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    } else {
      token = `token-${Date.now()}`; // fallback opaque token (not recommended for production)
    }
  }catch(e){
    console.error('JWT issue error', e);
    token = `token-${Date.now()}`;
  }

  // if user hasn't accepted terms, indicate that in response (include token so client can post acceptance)
  if(!user.acceptedTerms){
    return res.json({ status: 'needs_terms', needsAcceptance: true, user: { phone, id: user.id }, token });
  }

  res.json({ status: 'verified', token, user: { phone, id: user.id } });
});

// POST /api/auth/accept-terms
router.post('/accept-terms', (req, res) => {
  const { userId, name, signatureDataUrl } = req.body || {};
  if(!userId || !name || !signatureDataUrl) return res.status(400).json({ error: 'userId, name and signature required' });
  const users = readJson(usersFile);
  const user = users.find(u => u.id === userId);
  if(!user) return res.status(404).json({ error: 'user not found' });
  
  // Save signature image to disk (safer than storing large data URLs in JSON)
  try{
    const sigDir = path.join(__dirname, '../../storage/signatures');
    if(!fs.existsSync(sigDir)) fs.mkdirSync(sigDir, { recursive: true });
    const matches = signatureDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
    if(!matches) return res.status(400).json({ error: 'invalid signature format' });
    const ext = matches[1] === 'jpeg' ? 'jpg' : 'png';
    const data = matches[2];
    const filename = `${userId.replace(/[^a-zA-Z0-9-_]/g,'')}-${Date.now()}.${ext}`;
    const filepath = path.join(sigDir, filename);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));

    user.acceptedTerms = true;
    user.acceptedAt = new Date().toISOString();
    user.acceptedBy = name;
    user.signaturePath = path.relative(path.join(__dirname, '../../'), filepath).replace(/\\/g,'/');
    saveJson(usersFile, users);
    res.json({ status: 'accepted', userId, signaturePath: user.signaturePath });
  }catch(err){
    console.error('accept-terms error', err);
    res.status(500).json({ error: 'Failed to save signature' });
  }
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
