/*
  # Fix item claims storage
  
  1. Changes
    - Remove existing unique constraints that prevent multiple people from claiming the same item
    - Add indexes for better performance
    - Enable realtime subscriptions
*/

-- Remove existing unique constraints
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_bill_item_participant_key;
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_item_participant_key;
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_bill_id_item_id_key;

-- Create new indexes for better performance
CREATE INDEX IF NOT EXISTS item_claims_lookup_idx 
ON item_claims(bill_id, item_id, participant_id);

CREATE INDEX IF NOT EXISTS item_claims_share_count_idx 
ON item_claims(item_id, bill_id) 
INCLUDE (participant_id);

-- Enable full replica identity for realtime
ALTER TABLE item_claims REPLICA IDENTITY FULL;