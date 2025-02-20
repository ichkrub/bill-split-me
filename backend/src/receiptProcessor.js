import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function downloadImage(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function parseGeminiResponse(text) {
  // Initialize result structure
  const result = {
    items: [],
    billInfo: {
      restaurantName: '',
      date: null
    },
    charges: [
      { id: 'tax', name: 'Tax (GST)', amount: 0 },
      { id: 'service', name: 'Service Charge', amount: 0 }
    ]
  };

  try {
    // Parse JSON response if Gemini returned JSON
    if (text.includes('{') && text.includes('}')) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          items: parsed.items || [],
          billInfo: parsed.billInfo || result.billInfo,
          charges: parsed.charges || result.charges
        };
      }
    }

    // Fallback to text parsing if JSON parsing fails
    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.toLowerCase().includes('restaurant name:')) {
        result.billInfo.restaurantName = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.toLowerCase().includes('date:')) {
        const dateStr = trimmedLine.split(':')[1].trim();
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          result.billInfo.date = parsedDate.toISOString();
        }
      } else if (trimmedLine.toLowerCase().includes('items:')) {
        currentSection = 'items';
      } else if (trimmedLine.toLowerCase().includes('tax:')) {
        const amount = parseFloat(trimmedLine.match(/\d+\.\d{2}/)?.[0] || '0');
        result.charges[0].amount = amount;
      } else if (trimmedLine.toLowerCase().includes('service charge:')) {
        const amount = parseFloat(trimmedLine.match(/\d+\.\d{2}/)?.[0] || '0');
        result.charges[1].amount = amount;
      } else if (currentSection === 'items' && trimmedLine.includes('$')) {
        const itemMatch = trimmedLine.match(/(.+?)\$(\d+\.\d{2})(?:\s*x\s*(\d+))?/);
        if (itemMatch) {
          const [, name, price, quantity] = itemMatch;
          result.items.push({
            name: name.trim(),
            price: parseFloat(price),
            quantity: quantity ? parseInt(quantity) : 1
          });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
  }

  return result;
}

export async function processReceipt(imageUrl) {
  try {
    // Download the image
    const imageBytes = await downloadImage(imageUrl);

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Prepare the prompt
    const prompt = `Analyze this receipt image and extract the following information in JSON format:
    {
      "items": [
        {
          "name": "item name",
          "price": numeric price,
          "quantity": numeric quantity (default 1)
        }
      ],
      "billInfo": {
        "restaurantName": "name",
        "date": "ISO date string or null"
      },
      "charges": [
        {
          "id": "tax",
          "name": "Tax (GST)",
          "amount": numeric amount
        },
        {
          "id": "service",
          "name": "Service Charge",
          "amount": numeric amount
        }
      ]
    }

    Important:
    - Exclude any total/subtotal lines from items
    - Convert all prices to numbers
    - Include quantities if specified
    - Format date as ISO string if found
    - Set amounts to 0 if not found`;

    // Process with Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: Buffer.from(imageBytes).toString('base64')
        }
      }
    ]);

    const response = result.response;
    const text = response.text();
    
    return parseGeminiResponse(text);
  } catch (error) {
    console.error('Error in processReceipt:', error);
    throw new Error('Failed to process receipt with Gemini AI');
  }
}