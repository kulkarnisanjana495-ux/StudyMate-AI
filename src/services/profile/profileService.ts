import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, ProfileUpdateInput } from '../../types/profile';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured() || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, college_name, year_of_study, semester, email, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch warning:', error.message);
      return null;
    }

    return data as Profile | null;
  } catch (err) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

export async function updateProfile(
  expectedUserId: string,
  updates: ProfileUpdateInput
): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured.');
  }

  // Security enforcement: verify the current authenticated user matches expectedUserId
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in to update your profile.');
  }

  if (user.id !== expectedUserId) {
    throw new Error('Unauthorized profile modification attempt detected.');
  }

  // Update only permitted fields on user's own record
  const payload: Partial<Profile> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.college_name !== undefined) payload.college_name = updates.college_name.trim();
  if (updates.year_of_study !== undefined) payload.year_of_study = updates.year_of_study;
  if (updates.semester !== undefined) payload.semester = updates.semester;
  if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('id, name, college_name, year_of_study, semester, email, avatar_url, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as Profile;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error('Unauthorized avatar upload.');
  }

  // Limit file size to 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image size exceeds 2MB limit. Please choose a smaller file.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${user.id}/profile_${Date.now()}.${fileExt}`;

  // Attempt upload to 'avatars' bucket
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}. Make sure 'avatars' bucket exists in Supabase.`);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = data.publicUrl;

  // Persist updated avatar_url to public.profiles
  await updateProfile(user.id, { avatar_url: publicUrl });

  return publicUrl;
}
