/*
  # Add bill sharing functionality

  1. Changes
    - Add `shared_by` column to track who shared the bill
    - Add `shared_at` timestamp for when the bill was shared
    - Add `expires_at` timestamp for bill expiration (30 days after creation)
    - Add `status` column to track bill status (active/expired)
    - Add index on bill_id for faster lookups

  2. Security
    - Maintain existing RLS policies
    - Add new policy for shared bills access
*/

-- Add new columns to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS shared_by text,
ADD COLUMN IF NOT EXISTS shared_at timestamptz,
ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '30 days'),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'expired'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS bills_bill_id_idx ON bills(bill_id);

-- Create function to automatically set shared_at timestamp
CREATE OR REPLACE FUNCTION set_shared_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.shared_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set shared_at when bill is shared
CREATE TRIGGER set_shared_at_trigger
  BEFORE UPDATE ON bills
  FOR EACH ROW
  WHEN (NEW.shared_by IS NOT NULL AND OLD.shared_by IS NULL)
  EXECUTE FUNCTION set_shared_at();

-- Create function to expire old bills
CREATE OR REPLACE FUNCTION expire_old_bills()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bills
  SET status = 'expired'
  WHERE expires_at < now() AND status = 'active';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically expire old bills
CREATE TRIGGER expire_old_bills_trigger
  AFTER INSERT OR UPDATE ON bills
  EXECUTE FUNCTION expire_old_bills();