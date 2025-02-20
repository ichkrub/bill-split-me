/*
  # Add participants and item assignments tables

  1. New Tables
    - `participants`
      - `participant_id` (uuid, primary key)
      - `bill_id` (text, references bills)
      - `participant_name` (text)
      - `created_at` (timestamptz)
    
    - `item_assignments`
      - `assignment_id` (uuid, primary key)
      - `bill_id` (text, references bills)
      - `item_id` (uuid)
      - `participant_id` (uuid, references participants)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access
*/

-- Create participants table
CREATE TABLE participants (
  participant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id text REFERENCES bills(bill_id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create item assignments table
CREATE TABLE item_assignments (
  assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id text REFERENCES bills(bill_id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  participant_id uuid REFERENCES participants(participant_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_id, participant_id)
);

-- Enable RLS
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for participants
CREATE POLICY "Anyone can read participants"
  ON participants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create participants"
  ON participants
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for item assignments
CREATE POLICY "Anyone can read item assignments"
  ON item_assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create item assignments"
  ON item_assignments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Participants can update their assignments"
  ON item_assignments
  FOR UPDATE
  TO public
  USING (
    participant_id IN (
      SELECT participant_id 
      FROM participants 
      WHERE bill_id = item_assignments.bill_id
    )
  );

-- Create indexes for better performance
CREATE INDEX participants_bill_id_idx ON participants(bill_id);
CREATE INDEX item_assignments_bill_id_idx ON item_assignments(bill_id);
CREATE INDEX item_assignments_participant_idx ON item_assignments(participant_id);