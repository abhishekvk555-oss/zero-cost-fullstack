import express from 'express';
import { sql } from '../config/db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const items = await sql`SELECT * FROM items WHERE user_id = ${req.user.id} ORDER BY id DESC`;
  res.json(items);
});

router.post('/', auth, async (req, res) => {
  const { title } = req.body;
  const result = await sql`
    INSERT INTO items (user_id, title)
    VALUES (${req.user.id}, ${title})
    RETURNING *
  `;
  res.json(result[0]);
});

export default router;