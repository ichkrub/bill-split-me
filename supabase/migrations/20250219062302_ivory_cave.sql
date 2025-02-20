/*
  # Fix item claims constraints and indexes

  1. Changes
    - Remove duplicate claims before adding constraints
    - Add unique constraint for item claims
    - Create optimized indexes
    - Enable realtime support

  2. Security
    - Maintain data integrity
    - Prevent duplicate claims
*/

-- First, remove any duplicate claims
WITH duplicates AS (
  SELECT 
    bill_id,
    item_id,
    participant_id,
    claim_id,
    ROW_NUMBER() OVER (
      PARTITION BY bill_id, item_id, participant_id 
      ORDER BY created_at DESC
    ) as rn
  FROM item_claims
)
DELETE FROM item_claims
WHERE claim_id IN (
  SELECT claim_id 
  FROM duplicates 
  WHERE rn > 1
);

-- Drop existing constraints if they exist
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_bill_item_participant_key;
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_item_participant_key;
ALTER TABLE item_claims DROP CONSTRAINT IF EXISTS item_claims_bill_id_item_id_key;

-- Create new unique constraint to prevent duplicate claims
ALTER TABLE item_claims
ADD CONSTRAINT item_claims_unique_claim 
UNIQUE (bill_id, item_id, participant_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS item_claims_lookup_idx 
ON item_claims(bill_id, item_id, participant_id);

CREATE INDEX IF NOT EXISTS item_claims_share_count_idx 
ON item_claims(item_id, bill_id) 
INCLUDE (participant_id);

-- Enable realtime for item claims
ALTER PUBLICATION supabase_realtime ADD TABLE item_claims;

-- Enable full replica identity for realtime
ALTER TABLE item_claims REPLICA IDENTITY FULL;