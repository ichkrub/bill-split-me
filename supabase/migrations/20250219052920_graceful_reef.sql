/*
  # Update item claims to support shared items

  1. Changes
    - Remove unique constraint on item_id and participant_id
    - Add bill_id to unique constraint to allow same item to be shared
    - Add indexes for performance
  
  2. Security
    - Maintain existing RLS policies
    - Ensure participants can only modify their own claims
*/

-- Remove existing unique constraint
ALTER TABLE item_claims
DROP CONSTRAINT IF EXISTS item_claims_item_participant_key;

-- Add new unique constraint that includes bill_id
ALTER TABLE item_claims
ADD CONSTRAINT item_claims_bill_item_participant_key 
UNIQUE (bill_id, item_id, participant_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS item_claims_bill_item_participant_idx 
ON item_claims(bill_id, item_id, participant_id);

-- Create index for counting shares
CREATE INDEX IF NOT EXISTS item_claims_item_count_idx 
ON item_claims(item_id) 
WHERE bill_id IS NOT NULL;