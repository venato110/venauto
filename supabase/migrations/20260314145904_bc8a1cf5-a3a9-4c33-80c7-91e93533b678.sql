
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  type text NOT NULL DEFAULT 'reservation',
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Service can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parking_id uuid REFERENCES public.parking_spots(id) ON DELETE CASCADE NOT NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reservation_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Trigger to notify owner
CREATE OR REPLACE FUNCTION public.notify_owner_on_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  spot_name text;
  spot_owner uuid;
BEGIN
  SELECT name, owner_id INTO spot_name, spot_owner
  FROM public.parking_spots WHERE id = NEW.parking_id;
  
  IF spot_owner IS NOT NULL AND spot_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (spot_owner, 'New Reservation!', 'Someone reserved your spot: ' || spot_name || ' for ' || NEW.duration || 'h', 'reservation', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_reservation_notify_owner ON public.reservations;
CREATE TRIGGER on_reservation_notify_owner
  AFTER INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_owner_on_reservation();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
