import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { processReceipt } from './receiptProcessor.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Receipt processing endpoint
app.post('/process-receipt', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const result = await processReceipt(imageUrl);
    res.json(result);
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});