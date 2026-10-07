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

    if (!data) return null;

    const profileData = data as Profile;

    // If avatar_url is a relative storage path (e.g. "USER_ID/profile.jpg")
    // generate a signed URL from the private avatars bucket
    if (profileData.avatar_url && !profileData.avatar_url.startsWith('http')) {
      try {
        const cleanPath = profileData.avatar_url.replace(/^avatars\//, '');
        const { data: signed } = await supabase.storage
          .from('avatars')
          .createSignedUrl(cleanPath, 60 * 60 * 24 * 365);
        if (signed?.signedUrl) {
          profileData.avatar_url = signed.signedUrl;
        }
      } catch (err) {
        console.warn('Error resolving avatar storage path:', err);
      }
    }

    return profileData;
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

/**
 * Uploads a profile photo to the private 'avatars' bucket.
 * Structure: avatars/{user_id}/profile.{extension}
 * Accepts JPG, JPEG, PNG, and WEBP up to 5 MB.
 */
export async function uploadAvatar(file: File, expectedUserId?: string): Promise<string>;
export async function uploadAvatar(expectedUserId: string, file: File): Promise<string>;
export async function uploadAvatar(
  firstArg: File | string,
  secondArg?: File | string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Profile photo storage is not configured.');
  }

  let file: File;
  let expectedUserId: string | undefined;

  if (typeof firstArg === 'string') {
    expectedUserId = firstArg;
    if (!(secondArg instanceof File)) {
      throw new Error('Please select an image file to upload.');
    }
    file = secondArg;
  } else {
    file = firstArg;
    if (typeof secondArg === 'string') {
      expectedUserId = secondArg;
    }
  }

  // 1. Validate that a file was selected
  if (!file) {
    throw new Error('Please select an image file to upload.');
  }

  // Before uploading, get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Please sign in before uploading a profile photo.');
  }

  if (expectedUserId && user.id !== expectedUserId) {
    throw new Error('Unauthorized avatar upload.');
  }

  // 2. Accept image files only
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Only image files are accepted.');
  }

  // 3. Allow JPG, JPEG, PNG, and WEBP
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  const rawExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!allowedExtensions.includes(rawExtension)) {
    throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
  }

  // Standardize extension (jpeg -> jpg)
  const extension = rawExtension === 'jpeg' ? 'jpg' : rawExtension;

  // 4. Limit the file size to 5 MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Profile photo file size exceeds 5 MB. Please select a smaller image.');
  }

  // 6. Target path in authenticated user's own folder: {user_id}/profile.{extension}
  const filePath = `${user.id}/profile.${extension}`;

  // 7. If an old avatar exists, remove/replace it safely
  try {
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      const oldFiles = existingFiles
        .filter((item) => item.name.startsWith('profile.'))
        .map((item) => `${user.id}/${item.name}`);

      if (oldFiles.length > 0) {
        await supabase.storage.from('avatars').remove(oldFiles);
      }
    }
  } catch (cleanupErr) {
    console.warn('Notice while cleaning up previous avatar files:', cleanupErr);
  }

  // Upload to avatars bucket with upsert
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${extension}`,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    const msg = uploadError.message?.toLowerCase() || '';
    if (
      msg.includes('bucket not found') ||
      msg.includes('bucket_not_found') ||
      msg.includes('not found') ||
      (uploadError as unknown as { statusCode?: number | string }).statusCode === 404 ||
      (uploadError as unknown as { statusCode?: number | string }).statusCode === '404' ||
      (uploadError as unknown as { status?: number | string }).status === 404
    ) {
      throw new Error('Profile photo storage is not configured.');
    }
    throw new Error(`Profile photo upload failed: ${uploadError.message}`);
  }

  // 8. Generate avatar reference for private bucket via signed URL (1 year validity)
  const { data: signedData } = await supabase.storage
    .from('avatars')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365);

  let avatarRef = '';
  if (signedData?.signedUrl) {
    avatarRef = signedData.signedUrl;
  } else {
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    avatarRef = publicData.publicUrl;
  }

  // Add cache-busting timestamp so browser immediately reflects the new picture
  const finalAvatarUrl = `${avatarRef}${avatarRef.includes('?') ? '&' : '?'}t=${Date.now()}`;

  // Update public.profiles.avatar_url with the resulting avatar reference
  await updateProfile(user.id, { avatar_url: finalAvatarUrl });

  return finalAvatarUrl;
}
