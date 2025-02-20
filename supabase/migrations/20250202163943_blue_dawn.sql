/*
  # Create receipt storage schema

  1. New Tables
    - `receipts`
      - `id` (uuid, primary key)
      - `image_url` (text, nullable)
      - `restaurant_name` (text)
      - `date` (timestamptz)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references auth.users)
    - `receipt_items`
      - `id` (uuid, primary key)
      - `receipt_id` (uuid, references receipts)
      - `name` (text)
      - `price` (numeric)
      - `quantity` (integer)
    - `receipt_charges`
      - `id` (uuid, primary key)
      - `receipt_id` (uuid, references receipts)
      - `name` (text)
      - `amount` (numeric)
    - `receipt_diners`
      - `id` (uuid, primary key)
      - `receipt_id` (uuid, references receipts)
      - `name` (text)
    - `receipt_item_diners`
      - `id` (uuid, primary key)
      - `receipt_id` (uuid, references receipts)
      - `item_id` (uuid, references receipt_items)
      - `diner_id` (uuid, references receipt_diners)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own receipts
*/

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  restaurant_name text,
  date timestamptz,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create receipt_items table
CREATE TABLE IF NOT EXISTS receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  quantity integer DEFAULT 1
);

-- Create receipt_charges table
CREATE TABLE IF NOT EXISTS receipt_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL
);

-- Create receipt_diners table
CREATE TABLE IF NOT EXISTS receipt_diners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  name text NOT NULL
);

-- Create receipt_item_diners table for many-to-many relationship
CREATE TABLE IF NOT EXISTS receipt_item_diners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid REFERENCES receipts(id) ON DELETE CASCADE,
  item_id uuid REFERENCES receipt_items(id) ON DELETE CASCADE,
  diner_id uuid REFERENCES receipt_diners(id) ON DELETE CASCADE,
  UNIQUE(item_id, diner_id)
);

-- Enable Row Level Security
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_diners ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_item_diners ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own receipts"
  ON receipts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage items for their receipts"
  ON receipt_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_items.receipt_id
    AND receipts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_items.receipt_id
    AND receipts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage charges for their receipts"
  ON receipt_charges
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_charges.receipt_id
    AND receipts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_charges.receipt_id
    AND receipts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage diners for their receipts"
  ON receipt_diners
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_diners.receipt_id
    AND receipts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_diners.receipt_id
    AND receipts.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage item-diner relationships for their receipts"
  ON receipt_item_diners
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_item_diners.receipt_id
    AND receipts.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM receipts
    WHERE receipts.id = receipt_item_diners.receipt_id
    AND receipts.user_id = auth.uid()
  ));