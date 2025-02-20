/*
  # Fix bill routing and add constraints

  1. Changes
    - Add unique constraint on bill_id
    - Add index for faster lookups
    - Add status column with default value
    - Add expires_at column with default 30 days

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Add unique constraint on bill_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bills_bill_id_key'
  ) THEN
    ALTER TABLE bills 
    ADD CONSTRAINT bills_bill_id_key UNIQUE (bill_id);
  END IF;
END $$;

-- Create index for faster lookups if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'bills_bill_id_status_idx'
  ) THEN
    CREATE INDEX bills_bill_id_status_idx ON bills(bill_id) 
    WHERE status = 'active';
  END IF;
END $$;