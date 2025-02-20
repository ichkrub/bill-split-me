import cv from '@techstark/opencv-js';

export async function preprocessImage(imageData: ImageData): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    try {
      // Check if OpenCV is loaded
      if (typeof cv === 'undefined') {
        console.warn('OpenCV not loaded, returning original image');
        return resolve(imageData);
      }

      // Ensure OpenCV is ready
      if (cv.Mat) {
        processWithOpenCV(imageData, resolve, reject);
      } else {
        // If OpenCV is not ready, return original image
        console.warn('OpenCV not ready, returning original image');
        resolve(imageData);
      }
    } catch (error) {
      console.warn('OpenCV initialization failed, returning original image');
      resolve(imageData);
    }
  });
}

function processWithOpenCV(
  imageData: ImageData, 
  resolve: (result: ImageData) => void,
  reject: (error: Error) => void
) {
  let src: cv.Mat | null = null;
  let dst: cv.Mat | null = null;
  let gray: cv.Mat | null = null;
  let binary: cv.Mat | null = null;
  let deskewed: cv.Mat | null = null;

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
    
    // Apply adaptive thresholding
    cv.adaptiveThreshold(
      gray,
      binary,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );
    
    // Denoise the image
    cv.fastNlMeansDenoising(binary, dst);
    
    // Deskew the image if needed
    deskewed = deskewImage(dst);
    
    // Validate the processed image
    if (!deskewed || deskewed.empty()) {
      throw new Error('Failed to process image');
    }
    
    // Convert back to ImageData
    const processedData = new ImageData(
      new Uint8ClampedArray(deskewed.data),
      deskewed.cols,
      deskewed.rows
    );
    
    resolve(processedData);
  } catch (error) {
    console.warn('Image processing failed, returning original image:', error);
    resolve(imageData); // Return original image instead of rejecting
  } finally {
    // Clean up all matrices
    [src, dst, gray, binary, deskewed].forEach(mat => {
      if (mat) {
        try {
          mat.delete();
        } catch (e) {
          console.warn('Failed to delete matrix:', e);
        }
      }
    });
  }
}

function deskewImage(src: cv.Mat): cv.Mat {
  let points: cv.Mat | null = null;
  let rotMatrix: cv.Mat | null = null;
  let result: cv.Mat | null = null;

  try {
    const size = src.size();
    const center = new cv.Point(size.width / 2, size.height / 2);
    
    // Find all points in the image
    points = new cv.Mat();
    cv.findNonZero(src, points);
    
    if (points.empty()) {
      return src.clone(); // Return original if no points found
    }
    
    // Calculate the orientation
    const moments = cv.moments(points);
    if (moments.mu02 === 0) {
      return src.clone(); // Return original if can't calculate angle
    }
    
    const skew = moments.mu11 / moments.mu02;
    const angle = -Math.atan(skew) * (180 / Math.PI);
    
    // Get rotation matrix
    rotMatrix = cv.getRotationMatrix2D(center, angle, 1.0);
    
    // Apply rotation
    result = new cv.Mat();
    cv.warpAffine(
      src,
      result,
      rotMatrix,
      size,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255)
    );
    
    return result;
  } catch (error) {
    console.warn('Deskew failed, returning original image:', error);
    return src.clone();
  } finally {
    // Clean up matrices
    [points, rotMatrix].forEach(mat => {
      if (mat && mat !== result) {
        try {
          mat.delete();
        } catch (e) {
          console.warn('Failed to delete matrix:', e);
        }
      }
    });
  }
}

export function extractTextRegions(imageData: ImageData): { x: number; y: number; width: number; height: number }[] {
  const regions: { x: number; y: number; width: number; height: number }[] = [];
  
  // Check if OpenCV is available
  if (typeof cv === 'undefined') {
    console.warn('OpenCV not loaded, skipping text region extraction');
    return regions;
  }
  
  let src: cv.Mat | null = null;
  let gray: cv.Mat | null = null;
  let binary: cv.Mat | null = null;
  let contours: cv.MatVector | null = null;
  let hierarchy: cv.Mat | null = null;

  try {
    // Convert ImageData to Mat
    src = cv.matFromImageData(imageData);
    if (!src || src.empty()) {
      throw new Error('Failed to create source matrix');
    }
    
    gray = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply threshold
    binary = new cv.Mat();
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    
    // Find contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(
      binary,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );
    
    // Process each contour
    for (let i = 0; i < contours.size(); i++) {
      const rect = cv.boundingRect(contours.get(i));
      
      // Filter out noise (too small regions)
      if (rect.width > 20 && rect.height > 8) {
        regions.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }
    }
    
    return regions;
  } catch (error) {
    console.warn('Text region extraction failed:', error);
    return regions;
  } finally {
    // Clean up all matrices
    [src, gray, binary, hierarchy].forEach(mat => {
      if (mat) {
        try {
          mat.delete();
        } catch (e) {
          console.warn('Failed to delete matrix:', e);
        }
      }
    });
    if (contours) {
      try {
        contours.delete();
      } catch (e) {
        console.warn('Failed to delete contours:', e);
      }
    }
  }
}