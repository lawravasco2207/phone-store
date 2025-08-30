import express from 'express';
import { AzureOpenAI } from 'openai';
import db from '../models/index.js';
import 'dotenv/config';

const router = express.Router();

// Lazy Azure OpenAI client factory to avoid crashing when env is missing
function getAzureClient() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const baseURL = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.OPENAI_API_VERSION || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
  if (!apiKey || !baseURL) return null;
  try {
    return new AzureOpenAI({ apiKey, baseURL, apiVersion });
  } catch {
    return null;
  }
}

router.post('/', async (req, res) => {
    try {
        const { message, userId } = req.body;

        // fetch user + cart + last order 
    const user = userId ? await db.User.findByPk(userId, {
      include: [
        { model: db.CartItem, include: [db.Product] },
        { model: db.Order, limit: 1, order: [['createdAt', 'DESC']], include: [db.OrderItem] }
      ]
    }) : null;

        // Build context for AI 
        const context = `
          User: ${user?.name || 'Guest'}
          Cart: ${user?.CartItems?.map(ci => `${ci.Product.name} x${ci.quantity}`).join(', ') || 'Empty'}
          Last Order: ${user?.Orders?.[0]?.id || 'None'}
        `;

        // call azure openai when configured, else fallback
        const client = getAzureClient();
        let reply = '';
        if (client) {
          const completion = await client.chat.completions.create({
            messages: [
              { role: 'system', content: 'You are a helpful e-commerce assistant for a phone store.' },
              { role: 'system', content: `Context: ${context}` },
              { role: 'user', content: message }
            ],
            max_tokens: 500
          });
          reply = completion.choices?.[0]?.message?.content || '';
        } else {
          // graceful local fallback
          reply = `Hi${user?.name ? ' ' + user.name : ''}! I can't reach the AI service right now, but I can still help. You asked: "${message}". For product info, try browsing categories or search. If you need specs, open the product page.`;
        }

        res.json({ success: true, data: { reply }, reply });
  } catch (err) {
    console.error(err);
  res.status(500).json({ success: false, error: 'Chatbot error' });
  }
});

export default router;