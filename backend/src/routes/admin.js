import express from 'express';
import { sql } from '../config/db.js';

const router = express.Router();

// A simple secret key to protect the admin route
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'my_admin_password_123';

router.get('/students', async (req, res) => {
  const providedSecret = req.query.secret;

  if (providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Incorrect admin password.' });
  }

  try {
    // Join the tables to get the full picture
    const students = await sql`
      SELECT 
        c.id, 
        c.full_name, 
        c.email, 
        c.whatsapp_number, 
        c.created_at,
        p.status as payment_status
      FROM clients_details c
      LEFT JOIN payments_status p ON c.id = p.client_id
      ORDER BY c.created_at DESC
    `;
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;