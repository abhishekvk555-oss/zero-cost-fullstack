import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import practiceRoutes from './routes/practice.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/practice', practiceRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Backend on ${PORT}`));