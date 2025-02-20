/*
  # Add bills table for sharing feature

  1. New Tables
    - `bills`
      - `bill_id` (text, primary key) - Unique vanity ID for sharing
      - `created_at` (timestamptz) - Creation timestamp
      - `restaurant_name` (text) - Name of restaurant
      - `currency` (text) - Currency code
      - `total_amount` (numeric) - Total bill amount
      - `items` (jsonb) - Array of bill items
      - `diners` (jsonb) - Array of diners
      - `charges` (jsonb) - Additional charges
      
  2. Security
    - Enable RLS
    - Allow public read access to bills by bill_id
    - Allow authenticated users to create bills
*/

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  bill_id text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  restaurant_name text,
  currency text NOT NULL,
  total_amount numeric NOT NULL,
  items jsonb NOT NULL,
  diners jsonb NOT NULL,
  charges jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Allow public read access to bills by bill_id
CREATE POLICY "Anyone can read bills by bill_id"
  ON bills
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert bills
CREATE POLICY "Authenticated users can create bills"
  ON bills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own bills
CREATE POLICY "Users can update their own bills"
  ON bills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own bills
CREATE POLICY "Users can delete their own bills"
  ON bills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);