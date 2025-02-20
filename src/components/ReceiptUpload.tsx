import React from 'react';
import { Upload, Plus, Loader2, RotateCcw, X, Maximize2 } from 'lucide-react';
import { processReceiptImage } from '../utils/makeWebhook';
import { BillInfo } from '../types';
import { Link } from 'react-router-dom';

interface ReceiptUploadProps {
  onImageCapture: (file: File) => void;
  onItemsExtracted: (items: Array<{ name: string; price: number; quantity?: number }>) => void;
  onBillInfoExtracted: (info: { restaurantName: string; date: Date | null; currency: string }) => void;
  onAdditionalChargesExtracted: (charges: Array<{ id: string; name: string; amount: number }>) => void;
}

const ReceiptUpload = React.forwardRef<{ resetUpload: () => void }, ReceiptUploadProps>(
  ({ onImageCapture, onItemsExtracted, onBillInfoExtracted, onAdditionalChargesExtracted }, ref) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [processingStep, setProcessingStep] = React.useState<string>('');
    const [lastFile, setLastFile] = React.useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [showFullImage, setShowFullImage] = React.useState(false);

    React.useEffect(() => {
      return () => {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    }, [previewUrl]);

    React.useImperativeHandle(ref, () => ({
      resetUpload: () => {
        setLastFile(null);
        setError(null);
        setProcessingStep('');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setShowFullImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }));

    const createPreview = (file: File) => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setError(null);
      setProcessingStep('Processing receipt...');
      createPreview(file);
      onImageCapture(file);
      setLastFile(file);

      try {
        const result = await processReceiptImage(file);
        
        onItemsExtracted(result.items);
        onBillInfoExtracted({
          restaurantName: result.billInfo.restaurantName,
          date: result.billInfo.date ? new Date(result.billInfo.date) : null,
          currency: result.billInfo.currency || 'USD'
        });
        onAdditionalChargesExtracted(result.charges);

        setProcessingStep('Success!');
        setTimeout(() => {
          setProcessingStep('');
          setIsProcessing(false);
        }, 1000);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to process receipt. Please try again or add items manually.';
        
        setError(errorMessage);
        setIsProcessing(false);
        setProcessingStep('');
      }
    };

    const handleRetry = async () => {
      if (lastFile) {
        await handleFileChange({ target: { files: [lastFile] } } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleUploadClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const scrollToBillForm = () => {
      const addDinersHeading = document.querySelector('#bill-form h2');
      if (addDinersHeading) {
        const yOffset = -100; // Offset to account for sticky header
        const y = addDinersHeading.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };

    // Scroll to show progress
    React.useEffect(() => {
      if (isProcessing) {
        const progressElement = document.getElementById('receipt-progress');
        if (progressElement) {
          progressElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, [isProcessing]);

    return (
      <div className="card p-4 sm:p-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:min-h-[56px]">
            <button
              onClick={scrollToBillForm}
              className="btn btn-lg flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white border-0 text-base sm:text-lg"
            >
              <Plus size={20} />
              <span>Add Items Manually</span>
            </button>

            <div className="relative flex-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-sm text-gray-500 bg-white">or</span>
              </div>
            </div>

            <button
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="btn btn-lg btn-primary flex-1 flex items-center justify-center gap-2 text-base sm:text-lg relative overflow-hidden"
            >
              {isProcessing ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Upload size={20} />
              )}
              <span>{isProcessing ? 'Processing...' : 'Upload Receipt'}</span>
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help? Check out our{' '}
              <Link to="/how-it-works" className="text-primary hover:underline">
                guide on how to split bills
              </Link>
            </p>
          </div>

          {previewUrl && (
            <div className="relative mt-4">
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full h-full object-cover rounded-lg shadow-sm"
                />
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                  title="View full image"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*, image/heic, image/heif"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && (
          <div id="receipt-progress" className="mt-4 text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            {lastFile && (
              <button
                onClick={handleRetry}
                className="btn btn-secondary inline-flex items-center gap-2 text-sm"
              >
                <RotateCcw size={14} />
                <span>Retry Processing</span>
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div id="receipt-progress" className="mt-4 text-center">
            <p className="text-sm text-primary font-medium mb-2">
              {processingStep || 'Processing...'}
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300 ease-out"
                   style={{
                     width: processingStep === 'Success!' ? '100%' : '95%',
                     animation: processingStep === 'Success!' ? 'none' : 'progress-width 3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                   }} />
            </div>
          </div>
        )}

        {!isProcessing && !error && (
          <p id="receipt-progress" className="text-sm text-gray-500 mt-4 text-center">
            {lastFile 
              ? error 
                ? "We are working on improving our receipt processing. Please add items manually if it doesn't detect the items."
                : <span className="text-primary font-medium">The receipt was processed successfully! Scroll down to continue.</span>
              : "Supported formats: JPG, PNG"
            }
          </p>
        )}

        {showFullImage && previewUrl && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
            onClick={() => setShowFullImage(false)}
          > 
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(false);
              }}
              className="fixed top-4 right-4 p-3 bg-white hover:bg-gray-100 rounded-full shadow-lg text-gray-900 transition-all duration-200 hover:scale-110 z-[60]"
              aria-label="Close preview"
            >
              <X size={24} />
            </button>
            <div className="relative max-w-3xl w-full mx-auto overflow-auto max-h-[calc(100vh-2rem)]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullImage(false);
                }}
                className="hidden"
                aria-label="Close preview"
              >
                <X size={24} />
              </button>
              <img
                src={previewUrl}
                alt="Receipt"
                className="w-full h-auto rounded-lg shadow-2xl bg-white"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ReceiptUpload;