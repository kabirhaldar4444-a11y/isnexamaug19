-- This script fixes any existing user accounts that were created with missing GoTrue fields (which causes "Database error querying schema" on login).

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, '')
WHERE confirmation_token IS NULL OR recovery_token IS NULL;

-- Reload postgrest schema cache just to be safe
NOTIFY pgrst, 'reload schema';
