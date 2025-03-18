-- Remove monthly reset related columns from profiles table
ALTER TABLE profiles 
DROP COLUMN IF EXISTS last_prompt_reset,
DROP COLUMN IF EXISTS prompt_reset_date;

-- Update the handle_new_user function to remove monthly reset logic
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name,
    total_prompts_limit,
    prompt_count,
    has_prompt_history_access,
    is_premium
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    5, -- Default prompt limit for free tier
    0,
    false, -- Default no access to prompt history
    false  -- Default not premium
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 