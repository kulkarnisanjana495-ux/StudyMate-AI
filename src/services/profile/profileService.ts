import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile, ProfileUpdateInput } from '../../types/profile';
import { isProfileComplete } from '../../types/profile';

export { isProfileComplete };

/**
 * Resolves an avatar reference into a displayable URL.
 * If the reference is a storage path (e.g. "USER_ID/profile.jpg"), generates a signed URL from the private 'avatars' bucket.
 * If the reference is an external URL (e.g. from Google or GitHub), returns it.
 * If signed URL creation fails or no photo exists, falls back to the provided fallback URL or null.
 */
export async function getSignedAvatarUrl(
  avatarRef: string | null | undefined,
  fallbackUrl?: string | null,
  expirationSeconds: number = 86400
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return fallbackUrl || null;
  }

  if (!avatarRef || !avatarRef.trim()) {
    return fallbackUrl || null;
  }

  const cleanRef = avatarRef.trim();

  // If already an absolute http/https URL
  if (cleanRef.startsWith('http://') || cleanRef.startsWith('https://')) {
    // If it points to our Supabase avatars storage bucket, extract the underlying path and generate a fresh signed URL
    const avatarsMatch = cleanRef.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/([^?]+)/);
    if (avatarsMatch && avatarsMatch[1]) {
      const storagePath = decodeURIComponent(avatarsMatch[1]);
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .createSignedUrl(storagePath, expirationSeconds);
        if (data?.signedUrl) {
          return `${data.signedUrl}&t=${Date.now()}`;
        }
      } catch (err) {
        console.warn('Error creating signed URL for extracted avatar path:', err);
      }
    }
    return cleanRef;
  }

  // It is a storage path, e.g. "USER_ID/profile.jpg" or "avatars/USER_ID/profile.jpg"
  const storagePath = cleanRef.replace(/^avatars\//, '');
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUrl(storagePath, expirationSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Failed to create signed URL for avatar:', error?.message);
      return fallbackUrl || null;
    }

    return `${data.signedUrl}&t=${Date.now()}`;
  } catch (err) {
    console.warn('Exception creating signed URL for avatar:', err);
    return fallbackUrl || null;
  }
}

/**
 * Extracts the storage path from a URL or returns the path as-is.
 * Ensures public.profiles.avatar_url stores the storage path (e.g. "USER_ID/profile.jpg"),
 * not a temporary signed URL.
 */
export function extractStoragePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath || !urlOrPath.trim()) return null;
  const clean = urlOrPath.trim();

  // If it's a Supabase storage URL:
  const avatarsMatch = clean.match(/\/storage\/v1\/object\/(?:public|sign)\/avatars\/([^?]+)/);
  if (avatarsMatch && avatarsMatch[1]) {
    return decodeURIComponent(avatarsMatch[1]);
  }

  // If it's a prefixed path "avatars/USER_ID/profile.ext"
  if (clean.startsWith('avatars/')) {
    return clean.replace(/^avatars\//, '');
  }

  return clean;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured() || !userId) return null;

  try {
    let data: any = null;
    let error: any = null;

    // First attempt selecting with college_id
    const resWithCollegeId = await supabase
      .from('profiles')
      .select('id, name, college_name, college_id, year_of_study, semester, email, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (resWithCollegeId.error && resWithCollegeId.error.message.includes('college_id')) {
      // Fallback if college_id column does not exist yet in profiles table
      const resFallback = await supabase
        .from('profiles')
        .select('id, name, college_name, year_of_study, semester, email, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      data = resFallback.data;
      error = resFallback.error;
    } else {
      data = resWithCollegeId.data;
      error = resWithCollegeId.error;
    }

    if (error) {
      console.warn('Profile fetch warning:', error.message);
      return null;
    }

    if (!data) return null;

    const profileData = data as Profile;

    // Get current user to check for OAuth fallback picture if student hasn't uploaded one
    let oauthPictureFallback: string | null = null;
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user && authUser.user.id === userId) {
        oauthPictureFallback =
          authUser.user.user_metadata?.avatar_url ||
          authUser.user.user_metadata?.picture ||
          null;
      }
    } catch {
      // Non-critical fallback check
    }

    // Resolve avatar_url to a signed URL if it's a storage path, or use OAuth picture fallback
    if (profileData.avatar_url) {
      const signed = await getSignedAvatarUrl(profileData.avatar_url, oauthPictureFallback);
      profileData.avatar_url = signed;
    } else if (oauthPictureFallback) {
      profileData.avatar_url = oauthPictureFallback;
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
  if (updates.college_id !== undefined) payload.college_id = updates.college_id;
  if (updates.year_of_study !== undefined) payload.year_of_study = updates.year_of_study;
  if (updates.semester !== undefined) payload.semester = updates.semester;

  // Ensure storage path is saved, not a temporary signed URL
  if (updates.avatar_url !== undefined) {
    payload.avatar_url = extractStoragePath(updates.avatar_url);
  }

  let data: any = null;
  let updateError: any = null;

  // Try updating with college_id
  const resWithCollegeId = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', user.id)
    .select('id, name, college_name, college_id, year_of_study, semester, email, avatar_url, created_at, updated_at')
    .single();

  if (resWithCollegeId.error && resWithCollegeId.error.message.includes('college_id')) {
    // If college_id column is not yet migrated in Supabase, strip it and update college_name
    const fallbackPayload = { ...payload };
    delete fallbackPayload.college_id;
    const resFallback = await supabase
      .from('profiles')
      .update(fallbackPayload)
      .eq('id', user.id)
      .select('id, name, college_name, year_of_study, semester, email, avatar_url, created_at, updated_at')
      .single();
    data = resFallback.data;
    updateError = resFallback.error;
  } else {
    data = resWithCollegeId.data;
    updateError = resWithCollegeId.error;
  }

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`);
  }

  const updatedProfile = data as Profile;

  // Resolve signed URL for the returned in-memory Profile
  if (updatedProfile.avatar_url) {
    const signed = await getSignedAvatarUrl(updatedProfile.avatar_url);
    if (signed) {
      updatedProfile.avatar_url = signed;
    }
  }

  return updatedProfile;
}

/**
 * Uploads a profile photo to the private 'avatars' bucket.
 * Structure: avatars/{user_id}/profile.{extension}
 * Accepts JPG, JPEG, PNG, and WEBP up to 5 MB.
 * Stores STORAGE PATH in public.profiles.avatar_url.
 * Returns a fresh signed URL for immediate UI display.
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

  // 8. Store the STORAGE PATH in public.profiles.avatar_url (NOT the temporary signed URL)
  await updateProfile(user.id, { avatar_url: filePath });

  // 9. Generate a signed URL for immediate UI display (24 hours validity)
  const { data: signedData } = await supabase.storage
    .from('avatars')
    .createSignedUrl(filePath, 86400);

  const displaySignedUrl = signedData?.signedUrl
    ? `${signedData.signedUrl}&t=${Date.now()}`
    : filePath;

  return displaySignedUrl;
}

