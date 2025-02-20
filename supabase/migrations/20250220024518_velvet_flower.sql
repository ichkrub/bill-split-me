-- Update set_shared_at function with explicit search path
CREATE OR REPLACE FUNCTION public.set_shared_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.shared_at = now();
  RETURN NEW;
END;
$$;

-- Update check_bill_expiration function with explicit search path
CREATE OR REPLACE FUNCTION public.check_bill_expiration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only update status if it's currently active and expired
  IF NEW.status = 'active' AND NEW.expires_at < now() THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function with explicit search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;