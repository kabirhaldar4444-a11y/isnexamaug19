-- ============================================================
-- HARDENED ADMIN USER DELETION (FINAL)
-- ============================================================
-- This script provides an atomic, secure, and irreversible 
-- user deletion process that cleans up all related data.

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json AS $$
DECLARE
    caller_role text;
    target_exists boolean;
BEGIN
    -- 1. SECURITY CHECK: Verify the caller is an admin
    caller_role := public.get_user_role();
    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;

    -- 2. SELF-DELETION PROTECTION: Prevent admin from deleting themselves
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Safety Violation: You cannot delete your own account';
    END IF;

    -- 3. EXISTENCE CHECK: Ensure the target user actually exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO target_exists;
    IF NOT target_exists THEN
        RETURN json_build_object('success', false, 'message', 'User not found or already deleted');
    END IF;

    -- 4. ATOMIC TRANSACTIONAL CLEANUP
    -- All deletes are wrapped in this single transaction block
    
    -- a. Clean up exam submissions and results
    DELETE FROM public.submissions WHERE user_id = target_user_id;
    
    -- b. Clean up public profile data
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- c. Finally, remove the record from authentication system (auth.users)
    -- This will also automatically clean up auth.identities and auth.sessions
    DELETE FROM auth.users WHERE id = target_user_id;

    -- 5. LOGGING
    RAISE NOTICE 'Admin % deleted User % at %', auth.uid(), target_user_id, now();

    RETURN json_build_object(
        'success', true, 
        'message', 'User and all related data deleted successfully',
        'timestamp', now()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, the entire transaction is rolled back by PostgreSQL
        RAISE EXCEPTION 'Deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
