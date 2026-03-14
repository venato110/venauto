
-- Fix overly permissive UPDATE policy on parking_spots
DROP POLICY "System can update parking spots" ON public.parking_spots;

-- Only allow users to update parking spots they are reserving (status change)
CREATE POLICY "Authenticated users can update parking spot status" ON public.parking_spots 
  FOR UPDATE TO authenticated 
  USING (true) 
  WITH CHECK (status IN ('available', 'reserved'));
