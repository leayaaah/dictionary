-- Refresh PostgREST after the contribution RPCs are created or replaced.
-- This prevents a stale schema cache from hiding submit_contribution from the API.
notify pgrst, 'reload schema';
