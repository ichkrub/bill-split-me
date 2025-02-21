import { uploadReceipt } from '../lib/supabase';
import heic2any from 'heic2any';

// Compress image before processing
async function compressImage(file: File): Promise<File> {
  // Skip compression for small files (less than 300KB)
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Clean up function to remove object URL
    const cleanup = () => {
      URL.revokeObjectURL(img.src);
    };

    img.onload = () => {
      try {
        // Calculate new dimensions (max width: 960px, maintain aspect ratio)
        const maxWidth = 960;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          cleanup();
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress image
        ctx.fillStyle = 'white'; // Set white background
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Determine quality based on original file size
        let quality = 0.7; // Default quality
        if (file.size > 2 * 1024 * 1024) { // If larger than 2MB
          quality = 0.5;
        } else if (file.size > 1024 * 1024) { // If larger than 1MB
          quality = 0.6;
        }

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              // Create new file with same name but compressed
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              // If compression didn't help much, return original
              if (compressedFile.size > file.size * 0.9) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image'));
    };

    // Set crossOrigin to anonymous to avoid CORS issues on mobile
    img.crossOrigin = 'anonymous';
    
    // Create object URL with try-catch for mobile browsers
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(new Error('Failed to create image URL. Please try a different image.'));
    }
  });
}

// Convert file to base64
async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert HEIC to JPEG if necessary
async function convertHeicToJpeg(file: File): Promise<File> {
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    try {
      const blob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8 // Reduced quality for HEIC conversion
      });
      
      return new File(
        [Array.isArray(blob) ? blob[0] : blob],
        file.name.replace(/\.heic$/i, '.jpg'),
        { type: 'image/jpeg' }
      );
    } catch (error) {
      console.error('Error converting HEIC:', error);
      throw new Error('Failed to convert HEIC image. Please try a different image.');
    }
  }
  return file;
}

// Validate and normalize webhook response data
function validateWebhookResponse(responseData: any) {
  try {
    // Handle array response by taking the first item
    const data = Array.isArray(responseData) ? responseData[0] : responseData;

    // Ensure data is an object
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    // Detect currency from response
    const currency = data.currency || 'USD';

    // Parse and validate items
    const items = Array.isArray(data.items) ? data.items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        name: String(item.name || '').trim(),
        price: typeof item.price === 'number' ? Number((item.price / (item.quantity || 1)).toFixed(2)) : 0,
        quantity: Math.max(1, parseInt(item.quantity) || 1)
      }))
      .filter(item => item.name) : [];

    // Parse and validate charges
    const charges = data.charges || {};
    const parsedCharges = [
      { 
        id: 'tax', 
        name: 'Tax (GST)', 
        amount: typeof charges.tax === 'number' ? Number(charges.tax.toFixed(2)) : 0
      },
      { 
        id: 'service', 
        name: 'Service Charge', 
        amount: typeof charges.service_charge === 'number' ? Number(charges.service_charge.toFixed(2)) : 0
      },
      {
        id: 'discount',
        name: 'Discount',
        amount: typeof charges.discount === 'number' ? -Math.abs(Number(charges.discount.toFixed(2))) : 0
      }
    ];

    // Parse and validate date
    let date = null;
    if (data.date) {
      const parsedDate = new Date(data.date);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString();
      }
    }

    // Ensure at least one item exists
    if (items.length === 0) {
      throw new Error('No valid items found in the receipt');
    }

    return {
      items,
      billInfo: {
        restaurantName: String(data.restaurant || '').trim(),
        date,
        currency
      },
      charges: parsedCharges
    };
  } catch (error) {
    console.error('Error validating webhook response:', error);
    throw new Error(`Failed to process receipt data: ${error.message}`);
  }
}

// Send to Make.com webhook
async function sendToMakeWebhook(base64Image: string, mimeType: string, imageUrl: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  // Ensure imageUrl is valid
  const validImageUrl = imageUrl && typeof imageUrl === 'string' 
    ? imageUrl.startsWith('http') ? imageUrl : `https://${imageUrl}`
    : '';

  try {
    const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType,
        imageUrl: validImageUrl
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${await response.text()}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from server');
    }

    try {
      const responseData = JSON.parse(responseText);
      return validateWebhookResponse(responseData);
    } catch (error) {
      console.error('Raw response:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function processReceiptImage(file: File): Promise<{
  items: Array<{ name: string; price: number; quantity: number }>;
  billInfo: { restaurantName: string; date: string | null };
  charges: Array<{ id: string; name: string; amount: number }>;
}> {
  try {
    // Convert HEIC to JPEG if necessary
    const jpegFile = await convertHeicToJpeg(file);

    // Compress the image
    const compressedFile = await compressImage(jpegFile);
    console.log('Original size:', Math.round(file.size / 1024), 'KB');
    console.log('Compressed size:', Math.round(compressedFile.size / 1024), 'KB');

    // Upload to Supabase first and get the public URL
    const imageUrl = await uploadReceipt(compressedFile);
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Failed to get valid URL for receipt image');
    }

    // Convert to base64
    const base64Image = await convertFileToBase64(compressedFile);

    // Send to Make.com webhook with the Supabase public URL
    const data = await sendToMakeWebhook(base64Image, compressedFile.type, imageUrl);

    // Return the processed data
    return data;
  } catch (error) {
    console.error('Error processing receipt:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      originalError: error
    });
    
    throw new Error(error instanceof Error ? error.message : 'Failed to process receipt');
  }
}