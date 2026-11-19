import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { sql } from '../config/db.js';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/register', async (req, res) => {
  const { email, password, fullName, whatsappNumber } = req.body;
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const userResult = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      RETURNING id, email
    `;
    const user = userResult[0];

    const clientResult = await sql`
      INSERT INTO clients_details (user_id, full_name, email, whatsapp_number)
      VALUES (${user.id}, ${fullName}, ${email}, ${whatsappNumber})
      RETURNING id
    `;
    const clientId = clientResult[0].id;

    await sql`
      INSERT INTO payments_status (client_id, amount, status)
      VALUES (${clientId}, 199, 'pending')
    `;

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = result[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
  res.json({ user: { id: user.id, email: user.email }, token });
});

// 1. Request Password Reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = result[0];
    
    if (!user) return res.json({ message: 'If an account exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await sql`
      UPDATE users 
      SET reset_token = ${resetToken}, reset_token_expiry = ${resetExpiry}
      WHERE email = ${email}
    `;

    const resetLink = `https://datacanva.vercel.app/?reset_token=${resetToken}`;

    await resend.emails.send({
      from: 'DataCanva <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your DataCanva Password',
      html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><a href="${resetLink}">Reset Password</a>`
    });

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE reset_token = ${token} AND reset_token_expiry > NOW()
    `;
    const user = result[0];
    
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE users 
      SET password_hash = ${hash}, reset_token = NULL, reset_token_expiry = NULL 
      WHERE id = ${user.id}
    `;

    res.json({ message: 'Password reset successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;