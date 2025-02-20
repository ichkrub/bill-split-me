import React from 'react';
import { Download, Users, Share2, QrCode, Link as LinkIcon, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { BillInfo, DinerSummary } from '../types';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';

interface BillSummaryProps {
  dinerSummaries: DinerSummary[];
  billInfo: BillInfo;
  currencySymbol: string;
  onShare: () => Promise<string>;
}

export const BillSummary = React.forwardRef<{ resetShare: () => void }, BillSummaryProps>(({ dinerSummaries, billInfo, currencySymbol, onShare }, ref) => {
  const total = dinerSummaries.reduce((sum, diner) => sum + diner.total, 0);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  const shareRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<number>();
  const [isMobile] = React.useState(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  // Expose reset function to parent
  React.useImperativeHandle(ref, () => ({
    resetShare: () => {
      setShareUrl('');
      setQrCodeUrl(null);
      setCopied(false);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    }
  }));

  const allItemsAssigned = dinerSummaries.every(diner => 
    diner.items.every(item => item.diners.length > 0)
  );

  const generateImage = async () => {
    if (!summaryRef.current) return;
    setIsGenerating(true);

    try {
      // Create a clone of the summary element for image generation
      const element = summaryRef.current.cloneNode(true) as HTMLElement;
      element.style.padding = '32px';
      element.style.width = '600px';
      element.style.background = 'white';
      element.style.borderRadius = '16px';
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      document.body.appendChild(element);

      // Generate the canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        backgroundColor: 'white',
        logging: false,
      });

      // Clean up the temporary element
      document.body.removeChild(element);

      return canvas;
    } catch (error) {
      console.error('Failed to generate image:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummaryAction = async () => {
    try {
      const canvas = await generateImage();
      if (!canvas) return;

      if (isMobile) {
        // For mobile devices, try to use the native share API
        try {
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
          });

          if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'billsplit-summary.png')] })) {
            const file = new File([blob], 'billsplit-summary.png', { type: 'image/png' });
            await navigator.share({
              files: [file],
              title: 'BillSplit.me Summary',
              text: 'Here\'s your share of the bill!',
            });
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Failed to share:', error);
          }
        }
      }

      // Fallback to regular download for desktop or if sharing fails
      const link = document.createElement('a');
      link.download = 'billsplit-summary.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to process summary:', error);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const billId = await onShare();
      const url = `${window.location.origin}/split/${billId}`;
      setShareUrl(url);

      // Generate QR Code
      const qrCode = await QRCode.toDataURL(url, { width: 300 });
      setQrCodeUrl(qrCode);

      // Scroll to share section after a short delay with offset for sticky header
      setTimeout(() => {
        if (shareRef.current) {
          const offset = 100; // Offset for sticky header
          const elementPosition = shareRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareLink = async () => {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `Split bill from ${billInfo.restaurantName || 'our meal'}`,
          text: 'Join me in splitting the bill!',
          url: shareUrl
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to share:', error);
          // Fallback to copy if share fails
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Clear share data when component unmounts
  React.useEffect(() => {
    return () => {
      setShareUrl('');
      setQrCodeUrl(null);
      setCopied(false);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div ref={summaryRef} className="card p-4 sm:p-8">
        <div className="bg-primary text-white p-4 sm:p-6 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 rounded-t-3xl">
          <h2 className="text-xl font-semibold text-center">
            Bill Summary
          </h2>
          {(billInfo.restaurantName || billInfo.date) && (
            <div className="mt-2 text-sm text-white/90 text-center space-y-1">
              {billInfo.restaurantName && (
                <div>{billInfo.restaurantName}</div>
              )}
              {billInfo.date && (
                <div>
                  {new Intl.DateTimeFormat('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }).format(billInfo.date)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="space-y-6 mt-6">
          {dinerSummaries.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No People Added Yet</h3>
              <p className="text-gray-600 mb-4">Add people and assign items to see the bill split summary.</p>
              <a
                href="#bill-form"
                className="btn btn-primary inline-flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector('#bill-form');
                  if (element) {
                    const offset = 100; // Offset for sticky header
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <Users size={18} />
                <span>Add Person</span>
              </a>
            </div>
          ) : (
            <>
              {dinerSummaries.map((diner) => (
                <div key={diner.dinerId} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-medium text-lg mb-3">{diner.name}</h3>
                  <div className="space-y-2">
                    {diner.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>
                          {item.name}
                          {item.quantity > 1 && ` (×${item.quantity})`}
                        </span>
                        <span>{currencySymbol}{(item.price / item.diners.length).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>Subtotal</span>
                        <span>{currencySymbol}{diner.subtotal.toFixed(2)}</span>
                      </div>
                      {diner.charges.map((charge) => (
                        <div 
                          key={charge.name} 
                          className={`flex justify-between text-sm ${
                            charge.amount < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          <span>{charge.name}</span>
                          <span>{currencySymbol}{charge.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t mt-2">
                        <span>Total</span>
                        <span className="text-primary">{currencySymbol}{diner.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-xl">
                  <span>Grand Total</span>
                  <span className="text-primary">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {dinerSummaries.length > 0 && allItemsAssigned && (
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleSummaryAction}
            disabled={isGenerating}
            className="btn btn-primary text-lg py-5 px-10 flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>Download Summary</span>
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="btn btn-secondary text-lg py-5 px-10 flex items-center justify-center gap-3"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Link...</span>
              </>
            ) : (
              <>
                <Share2 className="w-6 h-6" />
                <span>Share & View Bill</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Share URL and QR Code for Shared Mode */}
      {dinerSummaries.length > 0 && shareUrl && (
        <div ref={shareRef} className="mt-8 space-y-6 scroll-mt-24">
          <div className="card p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Scan QR Code</h3>
            </div>
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-48 h-48 mx-auto"
              />
            ) : (
              <div className="w-48 h-48 mx-auto flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Share Link</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input flex-1 bg-gray-50"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={handleShareLink}
                className={`btn ${copied ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap transition-colors duration-200`}
              >
                {isMobile ? (
                  <span>{copied ? 'Copied!' : 'Share Link'}</span>
                ) : (
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Link expires in 10 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

BillSummary.displayName = 'BillSummary';

export default BillSummary;