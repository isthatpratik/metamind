import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Helper functions for auth
export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const checkExistingEmail = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
  // If no error, email exists
  return { exists: !error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Error updating password:', error);
    }

    return { data, error };
  } catch (error) {
    console.error('Exception updating password:', error);
    return { data: null, error: error as any };
  }
};

// Helper functions for profiles
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Helper functions for prompt history
export const savePromptHistory = async (userId: string, message: string, aiResponse: string, toolType: string) => {
  const { data, error } = await supabase
    .from('prompt_history')
    .insert([
      {
        user_id: userId,
        message,
        ai_response: aiResponse,
        tool_type: toolType,
      },
    ]);
  return { data, error };
};

export const getPromptHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('prompt_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Session management
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const getCurrentUser = async () => {
  const { session, error } = await getSession();
  if (error || !session?.user) return { user: null, error };
  
  const { data: profile, error: profileError } = await getProfile(session.user.id);
  if (profileError) return { user: null, error: profileError };
  
  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || session.user.email?.split("@")[0] || "",
      prompt_count: profile?.prompt_count || 0,
      total_prompts_limit: profile?.total_prompts_limit || 5,
      has_prompt_history_access: profile?.has_prompt_history_access || false,
      is_premium: profile?.is_premium || false,
    },
    error: null
  };
};

// Payment related functions
export const createPaymentIntent = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: { userId }
  });
  return { data, error };
};

export const handlePaymentSuccess = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('handle-payment-success', {
    body: { userId }
  });
  return { data, error };
}; 