
-- Add owner_id to parking_spots for marketplace listings
ALTER TABLE public.parking_spots 
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'garage',
  ADD COLUMN IF NOT EXISTS image_url text;

-- Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL,
  description text,
  reservation_id uuid REFERENCES public.reservations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clear existing mock parking data
DELETE FROM public.reservations;
DELETE FROM public.parking_spots;

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallet RLS
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Wallet transactions RLS
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Update parking_spots RLS
DROP POLICY IF EXISTS "Anyone can view spots" ON public.parking_spots;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.parking_spots;
DROP POLICY IF EXISTS "Allow public read access" ON public.parking_spots;

CREATE POLICY "Anyone can view available spots" ON public.parking_spots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can insert spots" ON public.parking_spots
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own spots" ON public.parking_spots
  FOR UPDATE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own spots" ON public.parking_spots
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Function to create wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create wallet
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- Enable realtime for wallets
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
