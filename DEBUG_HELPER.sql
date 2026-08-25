-- ============================================================
-- SQL SCRIPT: DATABASE DEBUG HELPER (TEMPORARY)
-- ============================================================
-- Run this in your Supabase SQL Editor. It allows running 
-- diagnostics from the terminal to find the login schema error.

CREATE OR REPLACE FUNCTION public.debug_run_query(query_text text)
RETURNS jsonb AS $$
DECLARE
  ret jsonb;
BEGIN
  EXECUTE 'SELECT jsonb_agg(t) FROM (' || query_text || ') t' INTO ret;
  RETURN COALESCE(ret, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
