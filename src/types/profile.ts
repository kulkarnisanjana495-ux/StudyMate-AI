export interface Profile {
  id: string;
  name: string | null;
  college_name: string | null;
  college_id?: string | null;
  year_of_study: string | null;
  semester: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateInput {
  name?: string;
  college_name?: string;
  college_id?: string | null;
  year_of_study?: string;
  semester?: string;
  avatar_url?: string;
}

/**
 * Checks whether required academic profile information is complete.
 * Name, College (either college_name or college_id), Year of Study, and Semester are required.
 * Profile photo (avatar) is optional.
 */
export function isProfileComplete(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false;
  const hasCollege = Boolean(
    (profile.college_name && profile.college_name.trim().length > 0) ||
    (profile.college_id && profile.college_id.trim().length > 0)
  );
  return Boolean(
    profile.name && profile.name.trim().length > 0 &&
    hasCollege &&
    profile.year_of_study && profile.year_of_study.trim().length > 0 &&
    profile.semester && profile.semester.trim().length > 0
  );
}
