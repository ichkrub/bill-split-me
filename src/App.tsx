import React from 'react';
import { BillSplitIcon } from './components/BillSplitIcon';
import { RotateCcw, Users, UserCheck, Upload, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CurrencyPicker, getCurrencySymbol } from './components/CurrencyPicker';
import { BillForm } from './components/BillForm';
import { BillSummary } from './components/BillSummary';
import ReceiptUpload from './components/ReceiptUpload';
import { AdditionalCharges } from './components/AdditionalCharges';
import { ShareBill } from './components/ShareBill';
import { HowItWorks } from './components/HowItWorks';
import { CookieConsent } from './components/CookieConsent';
import { Item, Diner, DinerSummary, AdditionalCharge, BillInfo } from './types';
import { supabase } from './lib/supabase';

// Cookie consent functions
const COOKIE_CONSENT_KEY = 'cookieConsent';
const CURRENCY_KEY = 'selectedCurrency';

function getCookieConsent(): string | null {
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function setCookieConsent(value: 'accepted' | 'declined'): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
}

function initializeAds(): void {
  try {
    // Initialize AdSense ads only if consent is given
    if (typeof window.adsbygoogle !== 'undefined') {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    }
  } catch (error) {
    console.error('Error initializing ads:', error);
  }
}

function App() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [diners, setDiners] = React.useState<Diner[]>([]);
  const [billId, setBillId] = React.useState<string | null>(null);
  const [billInfo, setBillInfo] = React.useState<BillInfo>({
    restaurantName: '',
    date: null,
    currency: localStorage.getItem(CURRENCY_KEY) || 'USD',
  });
  const [additionalCharges, setAdditionalCharges] = React.useState<AdditionalCharge[]>([
    { id: 'tax', name: 'Tax (GST)', amount: 0 },
    { id: 'service', name: 'Service Charge', amount: 0 },
  ]);
  const [showCookieConsent, setShowCookieConsent] = React.useState(false);
  const receiptUploadRef = React.useRef<{ resetUpload: () => void }>(null);
  const billSummaryRef = React.useRef<{ resetShare: () => void }>(null);

  // Check cookie consent on mount
  React.useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setShowCookieConsent(true);
    } else if (consent === 'accepted') {
      initializeAds();
    }
  }, []);

  // Load saved currency from localStorage
  React.useEffect(() => {
    const savedCurrency = localStorage.getItem(CURRENCY_KEY);
    if (savedCurrency) {
      setBillInfo(prev => ({ ...prev, currency: savedCurrency }));
    }
  }, []);

  const handleCurrencyChange = (currency: string) => {
    setBillInfo(prev => ({ ...prev, currency }));
    localStorage.setItem(CURRENCY_KEY, currency);
  };

  const handleAcceptCookies = () => {
    setCookieConsent('accepted');
    setShowCookieConsent(false);
    initializeAds();
  };

  const handleDeclineCookies = () => {
    setCookieConsent('declined');
    setShowCookieConsent(false);
  };

  const handleAddItem = (newItem: Omit<Item, 'id'>) => {
    setItems([...items, { ...newItem, id: crypto.randomUUID() }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<Item>) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleAddDiner = (name: string) => {
    setDiners([...diners, { id: crypto.randomUUID(), name }]);
  };

  const handleRemoveDiner = (id: string) => {
    setDiners(diners.filter((diner) => diner.id !== id));
    setItems(
      items.map((item) => ({
        ...item,
        diners: item.diners.filter((dinerId) => dinerId !== id),
      }))
    );
  };

  const handleImageCapture = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Handle image capture if needed
    };
    reader.readAsDataURL(file);
  };

  const handleExtractedItems = (extractedItems: Array<{ name: string; price: number; quantity?: number }>) => {
    // Filter out tax, service charges, and balance entries
    const excludeKeywords = ['tax', 'gst', 'hst', 'pst', 'service', 'gratuity', 'balance', 'total', 'subtotal'];
    
    const newItems = extractedItems
      .filter(item => !excludeKeywords.some(keyword => 
        item.name.toLowerCase().includes(keyword)
      ))
      .map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        price: item.price * (item.quantity || 1),
        quantity: item.quantity || 1,
        diners: [],
      }));
    
    setItems(newItems);
  };

  const handleAdditionalChargesExtracted = (charges: Array<{ id: string; name: string; amount: number }>) => {
    // Map the extracted charges to our format
    setAdditionalCharges(charges.map(charge => ({
      id: charge.id,
      name: charge.name,
      amount: charge.amount
    })));
  };

  const handleUpdateCharge = (id: string, amount: number, name?: string) => {
    if (amount < 0 && id !== 'discount') {
      // Remove non-discount charge
      setAdditionalCharges(prev => prev.filter(charge => charge.id !== id));
    } else {
      // Update or add charge
      setAdditionalCharges(prev => {
        const existingChargeIndex = prev.findIndex(c => c.id === id);
        const updatedCharge = {
          id,
          name: name || (id === 'discount' ? 'Discount' : prev[existingChargeIndex]?.name || 'Other Charge'),
          amount: id === 'discount' ? -Math.abs(amount) : amount // Ensure discount is always negative
        };

        if (existingChargeIndex >= 0) {
          // Update existing charge
          const newCharges = [...prev];
          newCharges[existingChargeIndex] = updatedCharge;
          return newCharges;
        } else {
          // Add new charge
          return [...prev, updatedCharge];
        }
      });
    }
  };

  const handleStartOver = () => {
    // Reset currency to USD
    localStorage.setItem(CURRENCY_KEY, 'USD');
    
    // Reset all state
    setItems([]);
    setDiners([]);
    setBillId(null); // Clear bill ID
    setBillInfo({
      restaurantName: '',
      date: null,
      currency: 'USD',
    });
    
    // Reset additional charges to initial state
    setAdditionalCharges([
      { id: 'tax', name: 'Tax (GST)', amount: 0 },
      { id: 'service', name: 'Service Charge', amount: 0 }
    ]);

    // Reset receipt upload component
    if (receiptUploadRef.current?.resetUpload) {
      receiptUploadRef.current.resetUpload();
    }

    // Reset bill summary share data
    if (billSummaryRef.current?.resetShare) {
      billSummaryRef.current.resetShare();
    }

    // Scroll to top with smooth animation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareBill = async () => {
    try {
      if (!billId) {
        // Generate a unique bill ID that's 6 characters long, uppercase alphanumeric
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newBillId = '';
        for (let i = 0; i < 6; i++) {
          newBillId += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Calculate total amount
        setBillId(newBillId);

        const dinerSummaries = calculateDinerSummaries();
        const totalAmount = dinerSummaries.reduce((sum, diner) => sum + diner.total, 0);

        // Get current user if authenticated
        const { data: { user } } = await supabase.auth.getUser();

        // Store bill in Supabase
        const { data, error } = await supabase
          .from('bills')
          .insert({
            bill_id: newBillId,
            restaurant_name: billInfo.restaurantName,
            currency: billInfo.currency,
            total_amount: totalAmount,
            items: items,
            diners: diners,
            charges: additionalCharges,
            user_id: user?.id || null,
            date: billInfo.date ? billInfo.date.toISOString() : null
          });

        if (error) {
          throw error;
        }

        // Set the bill ID in state
        setBillId(newBillId);
        return newBillId; // Return for the ShareBill component
      }
      return billId;
    } catch (error) {
      console.error('Error sharing bill:', error);
      throw error;
    }
  };

  const calculateDinerSummaries = (): DinerSummary[] => {
    const totalBeforeTax = items.reduce((sum, item) => sum + item.price, 0);
    const totalCharges = additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    return diners.map((diner) => {
      const dinerItems = items.filter((item) =>
        item.diners.includes(diner.id)
      );
      
      const subtotal = dinerItems.reduce(
        (sum, item) => sum + item.price / item.diners.length,
        0
      );
      
      const chargeRatio = totalBeforeTax > 0 ? subtotal / totalBeforeTax : 0;
      const charges = additionalCharges.map(charge => ({
        name: charge.name,
        amount: charge.amount * chargeRatio
      }));
      
      return {
        dinerId: diner.id,
        name: diner.name,
        items: dinerItems,
        subtotal,
        charges,
        total: subtotal + charges.reduce((sum, charge) => sum + charge.amount, 0),
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-screen-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BillSplitIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">BillSplit Me</h1>
            </Link>
            <button
              onClick={handleStartOver}
              className="btn btn-secondary flex items-center gap-1"
            >
              <RotateCcw size={16} />
              <span>Start Over</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Header Text */}
      <header className="relative bg-gradient-to-b from-white to-gray-50 border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,166,81,0.05),transparent)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0iIzAwQTY1MSIgZmlsbC1vcGFjaXR5PSIwLjAzIi8+PC9zdmc+')] opacity-50 pointer-events-none"></div>
        <div className="max-w-screen-lg mx-auto px-4 py-12 sm:py-20">
          <div className="text-center">
            <h1 className="text-[2.5rem] sm:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-[1.15] sm:leading-tight gradient-text">
              Split Bills Easily with Friends
            </h1>
            <h2 className="text-base sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium leading-snug sm:leading-relaxed">
              Upload your receipt, assign items, and let everyone pay their fair share—perfect for dining, group trips, and shared expenses.
            </h2>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-lg mx-auto px-4 py-8">
        <section id="upload-receipt" aria-label="Upload Receipt">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <h2 className="text-xl font-semibold">Add Your Bill</h2>
            </div>
            <p className="text-gray-600 ml-10">
              Upload a receipt or add items manually to get started
            </p>
          </div>
          <ReceiptUpload 
            ref={receiptUploadRef}
            onImageCapture={handleImageCapture} 
            onItemsExtracted={handleExtractedItems}
            onBillInfoExtracted={(info) => {
              setBillInfo(prev => ({ ...prev, ...info }));
            }}
            onAdditionalChargesExtracted={handleAdditionalChargesExtracted}
          />
        </section>

        {/* Two-column layout for desktop */}
        <div className="mt-12 relative">
          <div className="space-y-8">
            {/* Forms */}
            <div>
              <section id="bill-form" aria-label="Bill Details">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      2
                    </div>
                    <h2 className="text-xl font-semibold">Add People</h2>
                  </div>
                  <p className="text-gray-600 ml-10">
                    Add people who will be splitting the bill
                  </p>
                </div>
                <BillForm
                  items={items}
                  diners={diners}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  onAddDiner={handleAddDiner}
                  onRemoveDiner={handleRemoveDiner}
                  selectedCurrency={billInfo.currency}
                  onCurrencyChange={handleCurrencyChange}
                  currencySymbol={getCurrencySymbol(billInfo.currency)}
                />
              </section>

              <section id="additional-charges" aria-label="Additional Charges" className="mt-16">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      3
                    </div>
                    <h2 className="text-xl font-semibold">Additional Charges</h2>
                  </div>
                  <p className="text-gray-600 ml-10">
                    Add tax, service charge, or other additional charges
                  </p>
                </div>
                <AdditionalCharges
                  charges={additionalCharges}
                  onUpdateCharge={handleUpdateCharge}
                  currencySymbol={getCurrencySymbol(billInfo.currency)}
                />
              </section>

              <section id="bill-info" aria-label="Bill Information" className="mt-16">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      4
                    </div>
                    <h2 className="text-xl font-semibold">Bill Information</h2>
                  </div>
                  <p className="text-gray-600 ml-10">
                    Add restaurant details and date for reference
                  </p>
                </div>
                <div className="card p-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restaurant Name
                      </label>
                      <input
                        type="text"
                        value={billInfo.restaurantName}
                        onChange={(e) => setBillInfo({
                          ...billInfo,
                          restaurantName: e.target.value,
                        })}
                        placeholder="Enter restaurant name"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={billInfo.date ? new Date(billInfo.date.getTime() - billInfo.date.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const selectedDate = e.target.value 
                            ? new Date(new Date(e.target.value).getTime() + new Date().getTimezoneOffset() * 60000)
                            : null;
                          setBillInfo({
                            ...billInfo,
                            date: selectedDate,
                          });
                        }}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            {/* Summary */}
            <div>
              <section id="bill-summary" aria-label="Bill Summary">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      5
                    </div>
                    <h2 className="text-xl font-semibold">Review & Share</h2>
                  </div>
                  <p className="text-gray-600 ml-10">
                    Review the split and download the summary
                  </p>
                </div>
                <BillSummary
                  ref={billSummaryRef}
                  dinerSummaries={calculateDinerSummaries()}
                  billInfo={billInfo}
                  currencySymbol={getCurrencySymbol(billInfo.currency)}
                  onShare={handleShareBill}
                />
              </section>
            </div>
          </div>
        </div>

        <section id="how-it-works" aria-label="How It Works" className="mt-8">
          <HowItWorks />
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-8">
        <div className="max-w-screen-lg mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-2">
            <p className="text-gray-500 text-sm">
              © 2025 <a href="https://www.smbee.me" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SMBee</a>. All Rights Reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/how-it-works" className="text-sm text-gray-500 hover:text-primary hover:underline">
                How It Works
              </Link>
              <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-primary hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {showCookieConsent && (
        <CookieConsent
          onAccept={handleAcceptCookies}
          onDecline={handleDeclineCookies}
        />
      )}
    </div>
  );
}

// Add type definition for window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default App;