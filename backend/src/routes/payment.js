import express from 'express';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { sql } from '../config/db.js';

const router = express.Router();

const cashfree = new Cashfree(
  CFEnvironment.SANDBOX, 
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

// 1. Route to create a payment order
router.post('/create-order', async (req, res) => {
  const { clientId, amount, customerName, customerEmail, customerPhone } = req.body;

  try {
    const request = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `client_${clientId}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `http://localhost:5173/?order_id={order_id}`,
      },
    };

    const response = await cashfree.PGCreateOrder(request);
    
    // Save the Cashfree Order ID to your database
    await sql`
      UPDATE payments_status 
      SET cf_order_id = ${response.data.order_id}
      WHERE client_id = ${clientId}
    `;

    res.json({ payment_session_id: response.data.payment_session_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook route (Cashfree calls this automatically when payment succeeds)
router.post('/webhook', async (req, res) => {
  const event = req.body;

  if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
    const orderId = event.data.order.order_id;
    
    try {
      await sql`
        UPDATE payments_status 
        SET status = 'paid' 
        WHERE cf_order_id = ${orderId}
      `;
      console.log(`Payment successful for order: ${orderId}`);
    } catch (dbError) {
      console.error("Database update failed:", dbError);
    }
  }

  res.status(200).send("Webhook received");
});

export default router;