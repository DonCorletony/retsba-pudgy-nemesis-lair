-- Update the handle_new_user function to randomly assign default avatars
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  default_avatars TEXT[] := ARRAY[
    '/lovable-uploads/974266de-6040-4c69-9455-4c944c29eab8.png',
    '/lovable-uploads/20691bc6-2aec-4ccd-9169-9bc33731a939.png',
    '/lovable-uploads/e5be9a0d-1d7d-4cdd-991a-af29b8b18c35.png',
    '/lovable-uploads/af8febea-ae30-447d-9712-429233be90da.png',
    '/lovable-uploads/24ce7460-8793-4f59-99eb-131b522e185c.png',
    '/lovable-uploads/a3811e18-25f4-4dd0-b053-d08fb484bb70.png'
  ];
  random_avatar TEXT;
BEGIN
  -- Select a random avatar from the array
  random_avatar := default_avatars[1 + floor(random() * array_length(default_avatars, 1))::int];
  
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'display_name',
    random_avatar
  );
  RETURN NEW;
END;
$$;