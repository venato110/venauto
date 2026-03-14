
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create parking_spots table
CREATE TABLE public.parking_spots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  price_per_hour NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view parking spots" ON public.parking_spots FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can update parking spots" ON public.parking_spots FOR UPDATE TO authenticated USING (true);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  platform_commission NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reservations" ON public.reservations FOR UPDATE USING (auth.uid() = user_id);

-- Seed mock parking data in Baku, Azerbaijan
INSERT INTO public.parking_spots (name, address, latitude, longitude, price_per_hour, status) VALUES
  ('Fountain Square Parking', '28 May Street, Baku', 40.3693, 49.8371, 1.00, 'available'),
  ('Old City Parking', 'Icherisheher, Baku', 40.3661, 49.8372, 1.50, 'available'),
  ('Flame Towers Lot', 'Mehti Huseyn str, Baku', 40.3597, 49.8453, 2.00, 'available'),
  ('Baku Boulevard Parking', 'Neftchilar Avenue, Baku', 40.3631, 49.8415, 1.20, 'available'),
  ('Nizami Street Garage', 'Nizami Street, Baku', 40.3710, 49.8350, 0.80, 'available'),
  ('Heydar Aliyev Center Lot', 'Heydar Aliyev Ave, Baku', 40.3958, 49.8678, 1.50, 'reserved'),
  ('Port Baku Mall Parking', 'Neftchilar Ave 153, Baku', 40.3755, 49.8485, 2.50, 'available'),
  ('Tofig Bahramov Stadium Lot', 'Yusif Safarov str, Baku', 40.3789, 49.8532, 1.00, 'reserved'),
  ('Sahil Metro Parking', 'Sahil, Baku', 40.3721, 49.8431, 0.50, 'available'),
  ('Ganjlik Mall Parking', 'Babek Ave, Baku', 40.4012, 49.8531, 1.80, 'available');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
