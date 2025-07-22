-- Create a function to get email by username for authentication
CREATE OR REPLACE FUNCTION public.get_email_by_username(input_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email
  FROM auth.users au
  JOIN public.profiles p ON au.id = p.user_id
  WHERE LOWER(p.username) = LOWER(input_username)
  LIMIT 1;
$$;