/*
  # Fix bills table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Add new policies with proper user_id handling
    - Make user_id optional to support anonymous sharing
    
  2. Security
    - Allow public read access to all bills
    - Allow anyone to create bills
    - Allow bill owners to update/delete their bills
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read bills by bill_id" ON bills;
DROP POLICY IF EXISTS "Authenticated users can create bills" ON bills;
DROP POLICY IF EXISTS "Users can update their own bills" ON bills;
DROP POLICY IF EXISTS "Users can delete their own bills" ON bills;

-- Make user_id optional
ALTER TABLE bills ALTER COLUMN user_id DROP NOT NULL;

-- Create new policies
CREATE POLICY "Anyone can read bills"
  ON bills
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create bills"
  ON bills
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own bills"
  ON bills
  FOR UPDATE
  TO public
  USING (
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own bills"
  ON bills
  FOR DELETE
  TO public
  USING (
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );