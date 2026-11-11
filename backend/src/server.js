import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import practiceRoutes from './routes/practice.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';

dotenv.config();
const app = express();
app.use(cors());

// Custom JSON parser to keep the raw body for Cashfree webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.get('/', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Backend on ${PORT}`));