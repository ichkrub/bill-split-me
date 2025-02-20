/*
  # Add realtime item claims support

  1. New Tables
    - `item_claims`
      - `claim_id` (uuid, primary key)
      - `bill_id` (text, references bills)
      - `item_id` (uuid)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public access
    - Add realtime replication
*/

-- Create item claims table
CREATE TABLE item_claims (
  claim_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id text REFERENCES bills(bill_id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  participant_id uuid REFERENCES participants(participant_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(bill_id, item_id)
);

-- Enable RLS
ALTER TABLE item_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for item claims
CREATE POLICY "Anyone can read item claims"
  ON item_claims
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create item claims"
  ON item_claims
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Participants can update their claims"
  ON item_claims
  FOR UPDATE
  TO public
  USING (
    participant_id IN (
      SELECT participant_id 
      FROM participants 
      WHERE bill_id = item_claims.bill_id
    )
  );

CREATE POLICY "Participants can delete their claims"
  ON item_claims
  FOR DELETE
  TO public
  USING (
    participant_id IN (
      SELECT participant_id 
      FROM participants 
      WHERE bill_id = item_claims.bill_id
    )
  );

-- Create indexes for better performance
CREATE INDEX item_claims_bill_id_idx ON item_claims(bill_id);
CREATE INDEX item_claims_participant_idx ON item_claims(participant_id);

-- Enable realtime for item claims
ALTER TABLE item_claims REPLICA IDENTITY FULL;

-- Update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamps
CREATE TRIGGER update_item_claims_updated_at
  BEFORE UPDATE ON item_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();