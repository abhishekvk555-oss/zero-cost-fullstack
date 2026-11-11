import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

const router = express.Router();

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
      VALUES (${clientId}, 200, 'pending')
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

export default router;