import { createWorker, PSM } from 'tesseract.js';
import cv from '@techstark/opencv-js';
import { ReceiptData } from '../types/receipt';

// Define supported languages
const SUPPORTED_LANGUAGES = {
  eng: 'English',
  chi_sim: 'Chinese (Simplified)',
  chi_tra: 'Chinese (Traditional)',
  jpn: 'Japanese',
  kor: 'Korean',
  tha: 'Thai',
  vie: 'Vietnamese',
  fra: 'French',
  spa: 'Spanish',
  deu: 'German',
  ita: 'Italian'
} as const;

type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

export async function processReceiptLocally(
  imageFile: File, 
  languages: SupportedLanguage[] = ['eng']
): Promise<ReceiptData> {
  // Initialize default response
  const result: ReceiptData = {
    items: [],
    billInfo: {
      restaurantName: '',
      date: null,
      currency: 'USD'
    },
    charges: [
      { id: 'tax', name: 'Tax', amount: 0 },
      { id: 'service', name: 'Service Charge', amount: 0 }
    ]
  };

  let worker = null;
  let imageUrl: string | null = null;
  let processedImageUrl: string | null = null;

  try {
    console.log('Starting OCR process with languages:', languages);
    
    // Create URL for original image
    imageUrl = URL.createObjectURL(imageFile);
    
    // Convert File to image data for preprocessing
    const imageData = await fileToImageData(imageFile);
    console.log('Image converted to ImageData');
    
    // Preprocess image
    const processedImageData = await preprocessImage(imageData);
    console.log('Image preprocessing complete');

    // Create canvas from processed image data
    const canvas = document.createElement('canvas');
    canvas.width = processedImageData.width;
    canvas.height = processedImageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    ctx.putImageData(processedImageData, 0, 0);

    // Convert canvas to blob
    const processedBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to convert canvas to blob');
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });

    // Create URL for processed image
    processedImageUrl = URL.createObjectURL(processedBlob);

    // Initialize Tesseract
    worker = await createWorker();
    
    // Prioritize loading Japanese/Chinese first when selected
    const sortedLanguages = [...languages].sort((a, b) => {
      // Put Japanese, Chinese and Korean first if they are selected
      const aIsAsian = ['jpn', 'chi_sim', 'chi_tra', 'kor'].includes(a);
      const bIsAsian = ['jpn', 'chi_sim', 'chi_tra', 'kor'].includes(b);
      if (aIsAsian && !bIsAsian) return -1;
      if (!aIsAsian && bIsAsian) return 1;
      return 0;
    });
    
    // Load languages in prioritized order
    for (const lang of sortedLanguages) {
      console.log(`Loading language: ${lang}`);
      await worker.loadLanguage(lang);
    }
    
    const primaryLanguage = sortedLanguages[0];
    console.log(`Initializing Tesseract with primary language ${primaryLanguage} and additional languages: ${sortedLanguages.slice(1).join(', ')}`);
    await worker.initialize(sortedLanguages.join('+'));
    console.log('Tesseract worker initialized successfully');

    // Configure Tesseract parameters for receipt OCR
    const params = {
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
    };

    // Optimize parameters based on selected languages
    const hasJapanese = languages.includes('jpn');
    const hasChinese = languages.includes('chi_sim') || languages.includes('chi_tra');
    const hasKorean = languages.includes('kor');
    const hasThai = languages.includes('tha');
    const hasVietnamese = languages.includes('vie');
    const hasSoutheastAsian = hasThai || hasVietnamese;
    const hasAsianLanguages = hasJapanese || hasChinese || hasKorean || hasSoutheastAsian;
    
    // Set default currency based on primary language
    result.billInfo.currency = hasThai ? 'THB' : 
                              hasJapanese ? 'JPY' :
                              hasKorean ? 'KRW' :
                              hasChinese ? 'CNY' : 'USD';

    if (hasAsianLanguages) {
      // Optimize for Asian languages
      Object.assign(params, {
        tessedit_ocr_engine_mode: '3', // LSTM only, better for complex scripts
        lstm_choice_mode: '2', // More conservative LSTM choices
        tessedit_pageseg_mode: hasSoutheastAsian ? PSM.AUTO : (hasJapanese ? PSM.SINGLE_BLOCK : PSM.SPARSE_TEXT), // Auto for Thai/Vietnamese, Single block for Japanese
        textord_tabfind_vertical_text: hasJapanese || hasChinese || hasKorean ? '1' : '0', // Vertical text only for CJK
        textord_min_linesize: hasSoutheastAsian ? '2.0' : '1.5', // Larger for Thai due to stacking vowels
        preserve_interword_spaces: hasSoutheastAsian ? '1' : '0', // Keep spaces for Thai/Vietnamese
        language_model_penalty_non_dict_word: '0.5', // More lenient with non-dictionary words
        language_model_penalty_non_freq_dict_word: '0.5'
      });
    } else {
      // For Latin-based languages only, use whitelist
      Object.assign(params, {
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,()-:/',
        tessedit_ocr_engine_mode: '3', // LSTM only
        textord_min_linesize: '2.5'
      });
    }

    console.log('Setting Tesseract parameters:', params);
    await worker.setParameters(params);

    // Try processed image first
    let ocrResult;
    try {
      console.log('Attempting OCR on processed image...');
      ocrResult = await worker.recognize(processedImageUrl);
      console.log('OCR result from processed image:', { text: ocrResult.data.text.slice(0, 100) + '...', confidence: ocrResult.data.confidence });
      
      // If the processed image yields low confidence, try the original
      if (ocrResult.data.confidence < 30) {
        console.log('Low confidence on processed image, trying original...');
        const originalResult = await worker.recognize(imageUrl);
        console.log('OCR result from original image:', { text: originalResult.data.text.slice(0, 100) + '...', confidence: originalResult.data.confidence });
        
        // Use the result with higher confidence
        if (originalResult.data.confidence > ocrResult.data.confidence) {
          console.log('Original image gave better results');
          ocrResult = originalResult;
        }
      }
    } catch (e) {
      console.warn('Failed to process enhanced image, trying original:', e);
      ocrResult = await worker.recognize(imageUrl);
      console.log('OCR result from original image (after enhanced failed):', { text: ocrResult.data.text.slice(0, 100) + '...', confidence: ocrResult.data.confidence });
    }

    const { data: { text, confidence } } = ocrResult;
    console.log('OCR confidence:', confidence);
    console.log('Raw OCR text:', text);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text was detected in the image. Please ensure the receipt is clear and well-lit.');
    }

    if (confidence < 30) {
      console.warn('Low confidence OCR result:', confidence);
    }
    
    // Parse the OCR text
    const parsedData = parseReceiptText(text, languages);
    console.log('Parsed receipt data:', parsedData);
    
    // Update receipt data with parsed results
    result.items = parsedData.items || result.items;
    result.charges = parsedData.charges || result.charges;
    result.billInfo = {
      restaurantName: parsedData.billInfo?.restaurantName || result.billInfo.restaurantName,
      date: parsedData.billInfo?.date || result.billInfo.date,
      currency: parsedData.billInfo?.currency || result.billInfo.currency
    };
    
    // Validate results
    if (result.items.length === 0) {
      throw new Error('No items could be detected on the receipt. Please try again or enter items manually.');
    }

    console.log('Final processed result:', result);
    return result;
    
  } catch (error) {
    console.error('Error in processReceiptLocally:', error);
    if (error instanceof Error) {
      throw new Error(`Receipt processing failed: ${error.message}`);
    }
    throw new Error('Failed to process receipt. Please try again or enter items manually.');
  } finally {
    // Clean up resources
    if (worker) {
      await worker.terminate();
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }
  }
}

async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function preprocessImage(imageData: ImageData): Promise<ImageData> {
  return new Promise<ImageData>((resolve) => {
    try {
      // Check if OpenCV is loaded
      if (typeof cv === 'undefined') {
        console.warn('OpenCV not loaded, returning original image');
        return resolve(imageData);
      }

      // Ensure OpenCV is ready
      if (cv.Mat) {
        // Create matrices for processing
        let src: cv.Mat | null = null;
        let dst: cv.Mat | null = null;
        let gray: cv.Mat | null = null;
        let binary: cv.Mat | null = null;

        try {
          // Convert ImageData to Mat
          src = cv.matFromImageData(imageData);
          if (!src || src.empty()) {
            throw new Error('Failed to create source matrix');
          }

          // Create matrices for processing
          dst = new cv.Mat();
          gray = new cv.Mat();
          binary = new cv.Mat();

          // Convert to grayscale
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

          // Denoise the image using bilateral filter (better edge preservation)
          cv.bilateralFilter(gray, dst, 9, 75, 75);

          // Enhanced thresholding for Japanese text
          cv.adaptiveThreshold(
            dst,
            binary,
            255,
            cv.ADAPTIVE_THRESH_MEAN_C, // Mean method works better for Japanese characters
            cv.THRESH_BINARY,
            15,  // Larger block size for better character preservation
            3    // Lower constant for better contrast
          );

          // Apply morphological operations to improve character clarity
          const kernel = cv.Mat.ones(2, 2, cv.CV_8U);
          const temp = new cv.Mat();
          
          // Close small gaps within characters
          cv.morphologyEx(binary, temp, cv.MORPH_CLOSE, kernel);
          // Remove small noise while preserving character shape
          cv.morphologyEx(temp, dst, cv.MORPH_OPEN, kernel);
          
          kernel.delete();
          temp.delete();

          // Convert back to ImageData
          const processedData = new ImageData(
            new Uint8ClampedArray(dst.data),
            dst.cols,
            dst.rows
          );

          resolve(processedData);
        } finally {
          // Clean up all matrices
          [src, dst, gray, binary].forEach(mat => {
            if (mat) {
              try {
                mat.delete();
              } catch (e) {
                console.warn('Failed to delete matrix:', e);
              }
            }
          });
        }
      } else {
        console.warn('OpenCV not ready, returning original image');
        resolve(imageData);
      }
    } catch (error) {
      console.warn('Image preprocessing failed, returning original image:', error);
      resolve(imageData);
    }
  });
}

function parseReceiptText(text: string, languages: SupportedLanguage[] = ['eng']): ReceiptData {
  console.log('Starting text parsing with languages:', languages);
  
  // Split text into lines and normalize
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  
  const isThai = languages.includes('tha');
  const isJapanese = languages.includes('jpn');

  // Initialize result with currency based on language
  const result: ReceiptData = {
    items: [],
    billInfo: {
      restaurantName: '',
      date: null,
      currency: isThai ? 'THB' : 
                isJapanese ? 'JPY' :
                languages.includes('kor') ? 'KRW' :
                (languages.includes('chi_sim') || languages.includes('chi_tra')) ? 'CNY' :
                'USD'
    },
    charges: []
  };

  // Price patterns with Thai and Japanese support
  const currencyPattern = isThai ? '(?:฿|THB|บาท)' :
                         isJapanese ? '(?:¥|￥|円|JPY)' :
                         '(?:\\$|£|€|USD|EUR|GBP)';

  const pricePattern = new RegExp(
    `${currencyPattern}?\\s*[\\d,]+(?:[\\.:]?\\d{0,2})?\\s*${currencyPattern}?`,
    'i'
  );

  const datePattern = /(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|令和\d{1,2}年\d{1,2}月\d{1,2}日)/;
  
  // Tax and service charge patterns
  const taxPattern = isThai ? /(?:ภาษี|VAT|vat)/i :
                    isJapanese ? /(?:税|消費税|付加価値税)/i :
                    /(?:tax|gst|vat)/i;

  const servicePattern = isThai ? /(?:ค่าบริการ|เซอร์วิสชาร์จ)/i :
                        isJapanese ? /(?:サ[ー|―]ビス料|サ料|奉仕料|チップ)/i :
                        /(?:service.*charge|gratuity|tip)/i;

  const totalPattern = isThai ? /(?:รวม|ยอดรวม|ทั้งหมด)/i :
                      isJapanese ? /(?:合計|小計|総額|会計)/i :
                      /(?:total|sum|amount)/i;

  const quantityPattern = isThai ? /[xX]\s*(\d+)|(\d+)\s*(?:ชิ้น|จาน|ที่)/i :
                         isJapanese ? /[×xX]\s*(\d+)|(\d+)\s*(?:個|点|セット|set)/i :
                         /[xX]\s*(\d+)|(\d+)\s*(?:pcs?|pieces?)/i;

  let currentSection = 'header';
  let foundDate = false;
  let itemStarted = false;

  console.log('Processing lines:', lines);

  for (const [index, line] of lines.entries()) {
    console.log(`Processing line ${index}:`, line);

    // Skip short lines
    if (line.length < 2) {
      continue;
    }

    // Look for restaurant name in header
    if (!result.billInfo.restaurantName && currentSection === 'header') {
      if (line.length > 3 && !line.match(datePattern) && !line.match(pricePattern)) {
        result.billInfo.restaurantName = line.replace(/[（）(){}[\]]/g, '').trim();
        console.log('Found restaurant name:', result.billInfo.restaurantName);
        continue;
      }
    }

    // Look for date
    if (!foundDate) {
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        const matchedDate = dateMatch[0];
        result.billInfo.date = matchedDate.includes('令和') ? 
          convertReiwaToISO(matchedDate) : matchedDate;
        foundDate = true;
        continue;
      }
    }

    // Process prices and items
    const priceMatches = line.match(new RegExp(pricePattern, 'g'));
    if (priceMatches) {
      // Get the rightmost price
      const priceText = priceMatches[priceMatches.length - 1]
        .replace(new RegExp(`[,${currencyPattern}]`, 'gi'), '')
        .trim();
      
      const price = parseFloat(priceText);
      if (isNaN(price)) continue;

      // Get item name
      let itemName = line
        .replace(new RegExp(pricePattern, 'g'), '')
        .trim();

      // Extract quantity
      let quantity = 1;
      const quantityMatch = line.match(quantityPattern);
      if (quantityMatch) {
        quantity = parseInt(quantityMatch[1] || quantityMatch[2], 10) || 1;
        itemName = itemName
          .replace(/[×xX]\s*\d+/gi, '')
          .replace(/\d+\s*(?:ชิ้น|จาน|ที่|個|点|セット|set|pcs?|pieces?)/gi, '')
          .trim();
      }

      // Classify line
      if (line.match(taxPattern)) {
        result.charges.push({ 
          id: 'tax',
          name: isThai ? 'ภาษีมูลค่าเพิ่ม' : isJapanese ? '消費税' : 'Tax',
          amount: price
        });
      } else if (line.match(servicePattern)) {
        result.charges.push({
          id: 'service',
          name: isThai ? 'ค่าบริการ' : isJapanese ? 'サービス料' : 'Service Charge',
          amount: price
        });
      } else if (!line.match(totalPattern) && itemName && price > 0) {
        itemStarted = true;
        result.items.push({
          name: itemName,
          price: price / quantity,
          quantity
        });
      }
    } else if (itemStarted && line.length > 3) {
      // Append long lines to previous item name
      if (result.items.length > 0 && !line.match(totalPattern)) {
        const lastItem = result.items[result.items.length - 1];
        lastItem.name = `${lastItem.name} ${line}`.trim();
      }
    }
  }

  if (result.items.length === 0) {
    console.warn('No items found in receipt');
    throw new Error('No items could be detected on the receipt. Please try again or enter items manually.');
  }

  return result;
}

function convertReiwaToISO(dateStr: string): string {
  const matches = dateStr.match(/令和(\d+)年(\d+)月(\d+)日/);
  if (!matches) return dateStr;

  const [_, year, month, day] = matches.map(Number);
  const reiwaYear = 2018 + year;
  return `${reiwaYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
