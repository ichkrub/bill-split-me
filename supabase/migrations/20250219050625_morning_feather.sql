/*
  # Update bill expiration time
  
  1. Changes
    - Update default expiration time from 30 days to 10 days
    - Update existing bills to expire in 10 days from now
*/

-- Update default expiration time for new bills
ALTER TABLE bills 
ALTER COLUMN expires_at 
SET DEFAULT (now() + interval '10 days');

-- Update existing active bills to expire in 10 days
UPDATE bills 
SET expires_at = now() + interval '10 days'
WHERE status = 'active';