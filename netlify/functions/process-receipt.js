import fetch from 'node-fetch';
import { createWorker } from 'tesseract.js';

async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

function extractItems(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const items = [];
  
  // Enhanced patterns for restaurant receipt items
  const itemPatterns = [
    // Format: "2 x Chicken Rice $15.90"
    /^(?:(\d+)\s*(?:x|@|\*|pc|pcs|pieces?)\s*)?([^$\d]+?)\s*[\$]?\s*(\d+(?:\.\d{2})?)/i,
    
    // Format: "Chicken Rice $15.90 x 2"
    /^([^$\d]+?)\s*[\$]?\s*(\d+(?:\.\d{2})?)\s*(?:x\s*(\d+))?/i,
    
    // Format: "Chicken Rice.....$15.90"
    /^([^$\d]+?)(?:\.{2,}|\s{2,})[\$]?\s*(\d+(?:\.\d{2})?)/i,
    
    // Format: "$15.90 Chicken Rice"
    /^[\$]?\s*(\d+(?:\.\d{2})?)\s+([^$\d]+?)$/i
  ];

  // Common restaurant-specific words to help identify item sections
  const itemSectionMarkers = [
    /(?:food|beverage|drinks?|kitchen|bar|items?|order|qty|description|amount)/i,
    /(?:appetizers?|starters?|mains?|entrees?|desserts?|sides)/i,
    /(?:breakfast|lunch|dinner|specials?|combos?)/i
  ];

  // Exclude patterns for non-item lines
  const excludePatterns = [
    /(?:^|\s)(?:sub)?total\s*[:$]/i,
    /(?:^|\s)tax\s*[:$]/i,
    /(?:^|\s)(?:service charge|gratuity|tip)\s*[:$]/i,
    /(?:^|\s)(?:visa|mastercard|amex|credit\s*card)\s*[:$]/i,
    /(?:^|\s)(?:balance|change|cash|payment)\s*[:$]/i,
    /(?:^|\s)(?:table|server|guest|date|time)\s*[:$]/i,
    /(?:^|\s)(?:receipt|invoice|order)\s*(?:no|number|#)/i,
    /(?:^|\s)(?:tel|phone|address|email)(?:\s|:)/i,
    /^\s*\d+\s*$/,
    /^\s*-+\s*$/,
    /(?:^|\s)(?:thank|welcome|visit|www|http)/i
  ];

  let inItemSection = false;
  let itemSectionStarted = false;

  for (const line of lines) {
    // Skip excluded lines
    if (excludePatterns.some(pattern => pattern.test(line))) {
      continue;
    }

    // Look for item section markers
    if (itemSectionMarkers.some(marker => line.match(marker)) ||
        line.match(/^[-=]{3,}$/)) {
      inItemSection = true;
      itemSectionStarted = true;
      continue;
    }

    // If we haven't found an item section marker after a few lines, start looking for items
    if (!itemSectionStarted && items.length === 0 && lines.indexOf(line) > 5) {
      inItemSection = true;
    }

    if (!inItemSection && items.length === 0) {
      continue;
    }

    let matched = false;
    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      if (match) {
        let name, price, quantity = 1;

        if (pattern === itemPatterns[0]) {
          // "2 x Chicken Rice $15.90"
          quantity = parseInt(match[1]) || 1;
          name = match[2].trim();
          price = parseFloat(match[3]);
        } else if (pattern === itemPatterns[1]) {
          // "Chicken Rice $15.90 x 2"
          name = match[1].trim();
          price = parseFloat(match[2]);
          quantity = parseInt(match[3]) || 1;
        } else if (pattern === itemPatterns[2]) {
          // "Chicken Rice.....$15.90"
          name = match[1].trim();
          price = parseFloat(match[2]);
        } else if (pattern === itemPatterns[3]) {
          // "$15.90 Chicken Rice"
          price = parseFloat(match[1]);
          name = match[2].trim();
        }

        // Validate item
        if (name && price > 0 && name.length > 1 && 
            !name.match(/^(?:sub)?total$/i) &&
            !name.match(/^[0-9\s.,-]+$/) && // Avoid pure numbers/punctuation
            price < 1000) { // Reasonable price limit for restaurant items
          
          // Clean up the item name
          name = name
            .replace(/^[^a-zA-Z0-9]+/, '') // Remove leading special chars
            .replace(/[^a-zA-Z0-9\s&()\-']+$/, '') // Remove trailing special chars
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();

          // Additional validation for restaurant items
          if (name.length > 1 && 
              !name.match(/^(?:no|number|#|table|pax|person|guest)$/i)) {
            items.push({ name, price: price * quantity, quantity });
            matched = true;
            break;
          }
        }
      }
    }

    // If we've found items but haven't matched anything in several consecutive lines,
    // we've probably moved past the items section
    if (items.length > 0 && !matched) {
      let nextFiveLines = lines.slice(lines.indexOf(line), lines.indexOf(line) + 5);
      if (!nextFiveLines.some(l => itemPatterns.some(p => l.match(p)))) {
        break;
      }
    }
  }

  return items;
}

function extractCharges(text) {
  const charges = [
    { id: 'tax', name: 'Tax (GST)', amount: 0 },
    { id: 'service', name: 'Service Charge', amount: 0 }
  ];

  const lines = text.split('\n');
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Extract tax
    if (lowerLine.includes('tax') || lowerLine.includes('gst')) {
      const match = line.match(/\$?\s*(\d+\.\d{2})/);
      if (match) {
        charges[0].amount = parseFloat(match[1]);
      }
    }
    
    // Extract service charge
    if (lowerLine.includes('service') || lowerLine.includes('gratuity')) {
      const match = line.match(/\$?\s*(\d+\.\d{2})/);
      if (match) {
        charges[1].amount = parseFloat(match[1]);
      }
    }
  }

  return charges;
}

function extractBillInfo(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const billInfo = {
    restaurantName: lines[0] || '',
    date: null
  };

  // Look for date in the text
  const datePattern = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/;
  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[0]);
      if (!isNaN(parsedDate.getTime())) {
        billInfo.date = parsedDate.toISOString();
        break;
      }
    }
  }

  return billInfo;
}

export async function handler(event) {
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        details: 'Only POST requests are allowed'
      })
    };
  }

  let worker = null;

  try {
    // Validate request body
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const { imageUrl } = JSON.parse(event.body);
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Initialize Tesseract worker
    worker = await createWorker({
      logger: m => console.log(m)
    });

    // Load language and initialize
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Configure Tesseract parameters
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,()-:/',
      tessedit_pageseg_mode: '6',
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0',
      textord_heavy_nr: '1',
      textord_min_linesize: '2.5',
      tessedit_ocr_engine_mode: '3', // Use LSTM only
      tessedit_prefer_line_breaks: '1',
    });

    // Process the receipt
    const { data: { text, confidence } } = await worker.recognize(imageUrl);

    // Check confidence level
    if (confidence < 30) {
      throw new Error('Image quality too low for accurate text recognition');
    }

    // Extract receipt information
    const items = extractItems(text);
    const billInfo = extractBillInfo(text);
    const charges = extractCharges(text);

    // Validate results
    if (items.length === 0) {
      throw new Error('No items could be detected in the receipt');
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        items,
        billInfo,
        charges
      })
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to process receipt',
        details: error.message || 'An unexpected error occurred'
      })
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}