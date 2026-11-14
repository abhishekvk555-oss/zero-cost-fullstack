import express from 'express';
import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { sql } from '../config/db.js';

const router = express.Router();

const cashfree = new Cashfree(
  CFEnvironment.PRODUCTION, 
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

// 1. Save details and create a payment order
router.post('/create-order', async (req, res) => {
  const { amount, customerName, customerEmail, customerPhone } = req.body;

  try {
    // A. Save the student's details to your Neon Database
    const clientResult = await sql`
      INSERT INTO clients_details (full_name, email, whatsapp_number)
      VALUES (${customerName}, ${customerEmail}, ${customerPhone})
      RETURNING id
    `;
    const newClientId = clientResult[0].id;

    // B. Create a pending payment record linked to this new client
    await sql`
      INSERT INTO payments_status (client_id, amount, status)
      VALUES (${newClientId}, ${amount}, 'pending')
    `;

    // C. Create the Cashfree Order
    const request = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `client_${newClientId}`,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `https://zero-cost-fullstack-txiy.vercel.app/?order_id={order_id}`,
      },
    };

    const response = await cashfree.PGCreateOrder(request);
    
    // D. Save the Cashfree Order ID to the database
    await sql`
      UPDATE payments_status 
      SET cf_order_id = ${response.data.order_id}
      WHERE client_id = ${newClientId}
    `;

    res.json({ payment_session_id: response.data.payment_session_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook route
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

// 3. Check payment status route
router.get('/verify-payment', async (req, res) => {
  const { orderId } = req.query;
  try {
    const result = await sql`
      SELECT status FROM payments_status 
      WHERE cf_order_id = ${orderId}
    `;
    
    if (result.length > 0 && result[0].status === 'paid') {
      res.json({ isPaid: true });
    } else {
      res.json({ isPaid: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router; // <--- THIS MUST BE AT THE VERY BOTTOM