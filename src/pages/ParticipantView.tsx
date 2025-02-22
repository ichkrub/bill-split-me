import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Receipt, AlertCircle, CheckCircle2, ShoppingCart, Share2, ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Bill {
  bill_id: string;
  restaurant_name: string;
  currency: string;
  date: string | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    diners: string[];
  }>;
  charges: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
  diners: Array<{
    id: string;
    name: string;
  }>;
}

interface Participant {
  participant_id: string;
  participant_name: string;
}

interface ItemClaim {
  claim_id: string;
  item_id: string;
  participant_id: string;
  participant_name: string;
  share_count?: number;
}

export function ParticipantView() {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bill, setBill] = React.useState<Bill | null>(null);
  const [participant, setParticipant] = React.useState<Participant | null>(null);
  const [itemClaims, setItemClaims] = React.useState<Record<string, ItemClaim[]>>({});
  const [myItems, setMyItems] = React.useState<Set<string>>(new Set());
  const [processingItems, setProcessingItems] = React.useState<Set<string>>(new Set());
  const [subscriptionError, setSubscriptionError] = React.useState<string | null>(null); 
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [selectedDiner, setSelectedDiner] = React.useState<string | null>(null);
  const [totalBeforeTax, setTotalBeforeTax] = React.useState(0);
  const [myCharges, setMyCharges] = React.useState<Array<{ name: string; amount: number }>>([]);
  const [mySubtotal, setMySubtotal] = React.useState(0);
  const [myTotal, setMyTotal] = React.useState(0);

  // Track item share counts
  const [itemShares, setItemShares] = React.useState<Record<string, number>>({});

  // Optimistic updates for better UX
  const handleOptimisticUpdate = (itemId: string, isAdding: boolean, claimId?: string) => {
    setMyItems(prev => {
      const newItems = new Set(prev);
      if (isAdding) {
        newItems.add(itemId);
      } else {
        newItems.delete(itemId);
      }
      return newItems;
    });

    setItemClaims(prev => {
      const newClaims = { ...prev };
      if (isAdding) {
        newClaims[itemId] = newClaims[itemId] || [];
        newClaims[itemId].push({
          claim_id: claimId || 'temp-' + crypto.randomUUID(),
          item_id: itemId,
          participant_id: participant!.participant_id,
          participant_name: participant!.participant_name
        });
        
        // Update share count
        setItemShares(prev => ({
          ...prev,
          [itemId]: (prev[itemId] || 0) + 1
        }));
      } else {
        if (newClaims[itemId]) {
          newClaims[itemId] = newClaims[itemId].filter(
            claim => claim.participant_id !== participant!.participant_id
          );
          
          // Update share count
          setItemShares(prev => ({
            ...prev,
            [itemId]: Math.max(0, (prev[itemId] || 0) - 1)
          }));
          
          if (newClaims[itemId].length === 0) {
            delete newClaims[itemId];
          }
        }
      }
      return newClaims;
    });
  };

  // Redirect to home if no billId
  React.useEffect(() => {
    if (!billId || billId.length !== 6) {
      navigate('/', { replace: true });
      return;
    }
  }, [billId, navigate]);

  // Calculate charges and totals
  React.useEffect(() => {
    if (!bill || !selectedDiner) return;

    // Calculate total before tax
    const billTotal = bill.items.reduce((sum, item) => sum + item.price, 0);
    setTotalBeforeTax(billTotal);

    // Calculate my subtotal
    const myItems = bill.items.filter(item => item.diners.includes(selectedDiner));
    const subtotal = myItems.reduce((sum, item) => {
      const shareCount = item.diners.length || 1;
      return sum + (item.price / shareCount);
    }, 0);
    setMySubtotal(subtotal);

    // Calculate my share of charges
    const chargeRatio = billTotal > 0 ? subtotal / billTotal : 0;
    const charges = bill.charges.map(charge => ({
      name: charge.name,
      amount: charge.amount * chargeRatio
    }));
    setMyCharges(charges);

    // Calculate my total
    const total = subtotal + charges.reduce((sum, charge) => sum + charge.amount, 0);
    setMyTotal(total);
  }, [bill, selectedDiner, itemShares]);

  // Load bill details and set up real-time subscription
  React.useEffect(() => {
    async function loadBill() {
      try {
        if (!billId) {
          setError('Please provide a valid bill ID');
          return;
        }

        const { data: billData, error: billError } = await supabase
          .from('bills')
          .select('*')
          .eq('bill_id', billId)
          .eq('status', 'active')
          .single();

        if (billError || !billData) {
          setError('This bill doesn\'t exist or has expired');
          return;
        }

        // Extract diners from bill data
        const diners = billData.diners || [];
        
        // If there's only one diner, auto-select them
        if (diners.length === 1) {
          setSelectedDiner(diners[0].id);
          
          // Auto-claim their pre-assigned items
          const preAssignedItems = billData.items.filter(item => 
            item.diners.includes(diners[0].id)
          );
          
          const newMyItems = new Set(preAssignedItems.map(item => item.id));
          setMyItems(newMyItems);
        }

        setBill(billData);

        // Check for existing participant in localStorage
        const savedParticipantId = localStorage.getItem(`participant_${billId}`);
        if (savedParticipantId) {
          const { data: participantData, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('participant_id', savedParticipantId)
            .single();

          if (!participantError && participantData) {
            setParticipant(participantData);
          }
        }

        // Load all item claims for this bill
        const { data: claims, error: claimsError } = await supabase
          .from('item_claims')
          .select(`
            claim_id,
            item_id,
            participant_id,
            participants!inner (
              participant_name
            ),
            bill_id
          `)
          .eq('bill_id', billId);

        if (!claimsError && claims) {
          const claimsMap: Record<string, ItemClaim[]> = {};
          const shares: Record<string, number> = {};
          
          claims.forEach(claim => {
            const newClaim = {
              claim_id: claim.claim_id,
              item_id: claim.item_id,
              participant_id: claim.participant_id,
              participant_name: claim.participants.participant_name
            };

            if (!claimsMap[claim.item_id]) {
              claimsMap[claim.item_id] = [];
            }
            claimsMap[claim.item_id].push(newClaim);
            shares[claim.item_id] = (shares[claim.item_id] || 0) + 1;
          });

          setItemClaims(claimsMap);
          setItemShares(shares);
        }

        // Set up real-time subscription
        const channel = supabase.channel(`item_claims:${billId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'item_claims',
            filter: `bill_id=eq.${billId}`
          }, async (payload) => {
            console.log('Received real-time update:', payload);

            // Fetch all claims for the affected item
            const { data: updatedClaims, error: fetchError } = await supabase
              .from('item_claims')
              .select(`
                claim_id,
                item_id,
                participant_id,
                participants!inner (
                  participant_name
                ),
                bill_id
              `)
              .eq('bill_id', billId)
              .eq('item_id', payload.new?.item_id || payload.old?.item_id);

            if (!fetchError && updatedClaims) {
              setItemClaims(prev => {
                const newClaims = { ...prev };
                const itemId = payload.new?.item_id || payload.old?.item_id;
                
                if (updatedClaims.length === 0) {
                  delete newClaims[itemId];
                } else {
                  newClaims[itemId] = updatedClaims.map(claim => ({
                    claim_id: claim.claim_id,
                    item_id: claim.item_id,
                    participant_id: claim.participant_id,
                    participant_name: claim.participants.participant_name
                  }));
                }
                
                // Update share count
                setItemShares(prev => ({
                  ...prev,
                  [itemId]: updatedClaims.length
                }));
                
                return newClaims;
              });
            }
          })
          .subscribe((status, err) => {
            if (status === 'SUBSCRIPTION_ERROR') {
              console.error('Real-time subscription error:', err);
              setSubscriptionError('Failed to connect to real-time updates');
            } else {
              console.log('Subscription status:', status);
            }
          });

        channelRef.current = channel;

        return () => {
          channel.unsubscribe();
        };
      } catch (error: any) {
        console.error('Error loading bill:', error);
        setError(error.message || 'Failed to load bill details');
      } finally {
        setLoading(false);
      }
    } 

    loadBill();
  }, [billId]);

  const handleClaimItem = async (itemId: string) => {
    if (!participant) return;

    if (processingItems.has(itemId)) return;
    setProcessingItems(new Set([...processingItems, itemId]));

    try {
      const isItemClaimed = myItems.has(itemId);

      if (isItemClaimed) {
        // Find the claim ID for this participant and item
        const { data: claims } = await supabase
          .from('item_claims')
          .select('claim_id')
          .match({
            bill_id: billId,
            item_id: itemId,
            participant_id: participant.participant_id
          })
          .single();

        if (!claims) throw new Error('Claim not found');

        // Optimistic update for removing
        handleOptimisticUpdate(itemId, false);

        const { error } = await supabase
          .from('item_claims')
          .delete()
          .match({
            claim_id: claims.claim_id,
            bill_id: billId,
            item_id: itemId,
            participant_id: participant.participant_id
          });

        if (error) {
          // Revert optimistic update on error
          handleOptimisticUpdate(itemId, true);
          throw error;
        }
      } else {
        // Optimistic update for adding
        handleOptimisticUpdate(itemId, true);

        // Add new claim
        const { error: insertError } = await supabase
          .from('item_claims')
          .insert({
            bill_id: billId,
            item_id: itemId,
            participant_id: participant.participant_id
          });

        if (insertError) {
          // Revert optimistic update on error
          handleOptimisticUpdate(itemId, false);
          throw new Error('Failed to claim item');
        }
      }
    } catch (error) {
      console.error('Error claiming item:', error);
      
      // Show error message
      setError('Failed to update item. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessingItems(prev => {
        const newProcessingItems = new Set(prev);
        newProcessingItems.delete(itemId);
        return newProcessingItems;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Bill Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            The bill you're looking for might have expired or doesn't exist.
          </p>
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Create New Bill</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedDiner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6">
          <div className="text-center mb-6">
            <Receipt className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              This link will expire in 10 days
            </p>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Select Your Name
            </h1>
            <p className="text-gray-600">
              {bill.restaurant_name
                ? `Select your name to review your items from ${bill.restaurant_name}`
                : 'Select your name to review your items'}
            </p>
          </div>

          <div className="space-y-2">
            {bill.diners.map(diner => (
              <button
                key={diner.id}
                onClick={() => setSelectedDiner(diner.id)}
                className="w-full p-4 text-left rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <span className="font-medium">{diner.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-primary inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back to BillSplit.me</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header>
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-screen-lg mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-6 w-6 text-primary" />
                <Link to="/" className="text-xl font-semibold hover:text-primary">
                  BillSplit Me
                </Link>
              </div>
              <div className="text-lg font-medium text-gray-900">
                {bill.diners.find(d => d.id === selectedDiner)?.name}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Bill Info Banner */}
        <div className="bg-primary text-white">
          <div className="max-w-screen-lg mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-2">
              {bill.restaurant_name || 'Restaurant Bill'}
            </h1>
            {bill.date && (
              <p className="text-white/90">
                {new Date(bill.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-lg mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* My Items Section */}
          <section className="card p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Your Selected Items</h2>
              </div>
              <p className="text-gray-600 text-sm">
                {bill.restaurant_name 
                  ? `Items you selected from ${bill.restaurant_name}`
                  : 'Items you selected from the bill'}
              </p>
            </div>

            <div className="space-y-3">
              {bill.items
                .filter(item => item.diners.includes(selectedDiner))
                .map(item => {
                  const shareCount = item.diners.length || 1;
                  const pricePerShare = item.price / shareCount;
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center p-3 rounded-lg border-2 border-primary/20 bg-primary/5 ${
                        processingItems.has(item.id) ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.name}
                          {item.quantity > 1 && ` (×${item.quantity})`}
                          {shareCount > 1 && (
                            <span className="ml-2 text-sm text-gray-600">
                              Shared with {shareCount - 1} other{shareCount - 1 > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {bill.currency} {pricePerShare.toFixed(2)} per share
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="font-medium">
                          {bill.currency} {pricePerShare.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {!bill.items.some(item => item.diners.includes(selectedDiner)) && (
                <div className="text-center py-8 text-gray-500">
                  No items assigned to you yet
                </div>
              )}
            </div>
          </section>

          {/* Charges Section */}
          {mySubtotal > 0 && (
            <section className="card p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Additional Charges</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Your portion of tax and service fees, calculated based on your selected items
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>{bill.currency} {mySubtotal.toFixed(2)}</span>
                </div>

                {myCharges.map((charge) => (
                  <div 
                    key={charge.name} 
                    className={`flex justify-between text-sm ${charge.amount < 0 ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    <span>{charge.name}</span>
                    <span>{bill.currency} {charge.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Total Section */}
          <section className="card p-6 bg-primary/5 border-2 border-primary/20">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Your Total</h3>
                <p className="text-sm text-gray-600">Including your share of tax and service charges</p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {bill.currency} {myTotal.toFixed(2)}
              </div>
            </div>
          </section>

          {/* Back to Home */}
          <div className="text-center mt-8 space-y-8">
            {/* Bill Overview */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Bill Overview</h3>
              <p className="text-sm text-gray-600 mb-4">Everyone's share of the bill</p>
              <div className="space-y-4">
                {bill.diners.map(diner => {
                  const dinerItems = bill.items.filter(item => item.diners.includes(diner.id));
                  const dinerSubtotal = dinerItems.reduce((sum, item) => 
                    sum + (item.price / item.diners.length), 0
                  );
                  const chargeRatio = totalBeforeTax > 0 ? dinerSubtotal / totalBeforeTax : 0;
                  const dinerCharges = bill.charges.reduce((sum, charge) => 
                    sum + (charge.amount * chargeRatio), 0
                  );
                  const dinerTotal = dinerSubtotal + dinerCharges;

                  return (
                    <div 
                      key={diner.id}
                      className={`flex justify-between items-center ${
                        diner.id === selectedDiner ? 'text-primary font-medium' : 'text-gray-600'
                      }`}
                    >
                      <span>{diner.name}</span>
                      <span>{bill.currency} {dinerTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between font-bold">
                    <span>Total Bill</span>
                    <span>{bill.currency} {(totalBeforeTax + bill.charges.reduce((sum, charge) => sum + charge.amount, 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="text-gray-500 hover:text-primary inline-flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Back to BillSplit.me</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}