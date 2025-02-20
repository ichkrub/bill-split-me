import React from 'react';
import { Share2, Copy, QrCode, Link as LinkIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { BillInfo, DinerSummary } from '../types';
import { supabase } from '../lib/supabase';

interface ShareBillProps {
  billId: string | null;
  dinerSummaries: DinerSummary[];
  billInfo: BillInfo;
  onShare: () => Promise<string>;
}

export function ShareBill({ billId, dinerSummaries, billInfo, onShare }: ShareBillProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<number>();
  const [shareUrl, setShareUrl] = React.useState<string>('');

  const generateShareLink = () => {
    if (!billId) return '';
    return `${window.location.origin}/split/${billId}`;
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const generatedBillId = await onShare();
      if (generatedBillId) {
        const url = `${window.location.origin}/split/${generatedBillId}`;
        setShareUrl(url);
        await generateQRCode(url);
        
        // Update the bill with sharing details
        const { error: updateError } = await supabase
          .from('bills')
          .update({
            shared_by: 'web',
            status: 'active'
          })
          .eq('bill_id', generatedBillId);

        if (updateError) {
          console.error('Error updating bill share status:', updateError);
        }

        // Try native share if available and supported
        if (navigator.share && navigator.canShare && navigator.canShare({ url })) {
          await navigator.share({
            title: 'Split Bill',
            text: `Join me in splitting the bill from ${billInfo.restaurantName || 'our meal'}!`,
            url,
          });
        } else {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
          } catch (clipboardError) {
            console.error('Clipboard access denied:', clipboardError);
          }
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsGenerating(false);
      setCopied(false);
    }
  };

  if (!dinerSummaries.length) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="btn btn-primary text-lg py-5 px-10 flex items-center justify-center gap-3 w-full sm:w-auto min-w-[200px] mb-6"
      >
        <Share2 className="w-5 h-5" />
        <span>{billId ? 'Share Bill' : 'Generate Share Link'}</span>
      </button>

      {billId && qrCodeUrl && (
        <div className="w-full max-w-sm mx-auto space-y-6">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Scan QR Code</h3>
            </div>
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-48 h-48 mx-auto rounded-lg"
            />
            <p className="text-sm text-gray-500">
              Scan to join the bill split
            </p>
          </div>

          {/* Share Link */}
          <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Share Link</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input text-sm py-2 flex-1 bg-gray-50"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    if (timeoutRef.current) {
                      window.clearTimeout(timeoutRef.current);
                    }
                    timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
                  } catch (error) {
                    console.error('Failed to copy:', error);
                  }
                }}
                className={`btn ${copied ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap transition-colors duration-200`}
              >
                {copied ? (
                  <span>Copied!</span>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
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
}