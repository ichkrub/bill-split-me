/*
  # Fix item claims constraint

  1. Changes
    - Drop the unique constraint on (bill_id, item_id)
    - Add a unique constraint on (item_id, participant_id)
    - This allows multiple participants to claim the same item

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing unique constraint
ALTER TABLE item_claims
DROP CONSTRAINT IF EXISTS item_claims_bill_id_item_id_key;

-- Add new unique constraint to prevent duplicate claims by the same participant
ALTER TABLE item_claims
ADD CONSTRAINT item_claims_item_participant_key UNIQUE (item_id, participant_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS item_claims_item_participant_idx 
ON item_claims(item_id, participant_id);