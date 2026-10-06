export interface Profile {
  id: string;
  name: string | null;
  college_name: string | null;
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
  year_of_study?: string;
  semester?: string;
  avatar_url?: string;
}
