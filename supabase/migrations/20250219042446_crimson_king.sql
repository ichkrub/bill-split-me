/*
  # Optimize bill expiration handling

  1. Changes
    - Remove recursive trigger that was causing stack depth issues
    - Replace with a more efficient expiration check
    - Add index on expires_at and status for faster queries

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS expire_old_bills_trigger ON bills;
DROP FUNCTION IF EXISTS expire_old_bills();

-- Create index for expiration queries
CREATE INDEX IF NOT EXISTS bills_expiration_idx ON bills(expires_at) WHERE status = 'active';

-- Create optimized expiration function
CREATE OR REPLACE FUNCTION check_bill_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status if it's currently active and expired
  IF NEW.status = 'active' AND NEW.expires_at < now() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create optimized trigger that runs before insert/update
CREATE TRIGGER check_bill_expiration_trigger
  BEFORE INSERT OR UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION check_bill_expiration();

-- Update any existing expired bills
UPDATE bills
SET status = 'expired'
WHERE status = 'active' 
AND expires_at < now();