import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle2,
  Clock,
  Building,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, uploadAvatar } from '../services/profile/profileService';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Postgraduate / Masters',
  'PhD / Research Scholar',
];

const SEMESTER_OPTIONS = [
  'Semester 1',
  'Semester 2',
  'Semester 3',
  'Semester 4',
  'Semester 5',
  'Semester 6',
  'Semester 7',
  'Semester 8',
  'Semester 9',
  'Semester 10',
];

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showAvatarUrlField, setShowAvatarUrlField] = useState(false);

  // Initialize fields from profile or user
  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '');
      setCollegeName(profile.college_name || '');
      setYearOfStudy(profile.year_of_study || '');
      setSemester(profile.semester || '');
      setAvatarUrlInput(profile.avatar_url || '');
    } else if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '');
      setAvatarUrlInput(user.user_metadata?.avatar_url || '');
    }
  }, [profile, user]);

  // Check URL query param ?edit=true
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [searchParams]);

  const handleStartEditing = () => {
    setIsEditing(true);
    setSearchParams({ edit: 'true' });
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSearchParams({});
    setFeedback(null);
    if (profile) {
      setName(profile.name || '');
      setCollegeName(profile.college_name || '');
      setYearOfStudy(profile.year_of_study || '');
      setSemester(profile.semester || '');
      setAvatarUrlInput(profile.avatar_url || '');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Full name cannot be blank.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      await updateProfile(user.id, {
        name: name.trim(),
        college_name: collegeName.trim() || undefined,
        year_of_study: yearOfStudy || undefined,
        semester: semester || undefined,
        avatar_url: avatarUrlInput.trim() || undefined,
      });

      await refreshProfile();
      setFeedback({ type: 'success', message: 'Student profile updated successfully!' });
      setIsEditing(false);
      setSearchParams({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadingPhoto(true);
      setFeedback(null);
      const newUrl = await uploadAvatar(user.id, file);
      setAvatarUrlInput(newUrl);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Avatar image uploaded and updated successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setFeedback({
        type: 'error',
        message: `${msg}. You can also provide an image URL directly below.`,
      });
      setShowAvatarUrlField(true);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = profile?.email || user?.email || '';
  const isEmailVerified = Boolean(user?.email_confirmed_at);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Student Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your verified academic credentials and university affiliations.
          </p>
        </div>

        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartEditing}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Banner with Avatar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar with optional change overlay */}
            <div className="relative group">
              <ProfileAvatar
                name={displayName}
                avatarUrl={profile?.avatar_url || avatarUrlInput}
                size="xl"
                className="border-4 border-white/20 shadow-xl"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer text-[10px] font-semibold"
                title="Change Avatar"
              >
                {uploadingPhoto ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Upload</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Profile Header Details */}
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {displayName}
                </h2>
                {isEmailVerified && (
                  <span
                    title="Verified University Student"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 opacity-80" />
                <span>{displayEmail}</span>
              </p>
              <p className="text-[11px] text-indigo-300/80">
                {profile?.college_name || 'College not registered'} • {profile?.year_of_study || 'Year not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content: View or Edit Form */}
        <div className="p-6 sm:p-8">
          {isEditing ? (
            /* Edit Form */
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <Input
                  label="Student Full Name"
                  placeholder="e.g. Rashmi Chimmalagi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                {/* Email (Read Only per specifications) */}
                <Input
                  label="University Email (Read-Only)"
                  value={displayEmail}
                  disabled
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Registered email address is managed via Supabase Auth."
                />

                {/* College Name */}
                <Input
                  label="College / University Name"
                  placeholder="e.g. National Institute of Engineering"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  leftIcon={<Building className="w-4 h-4" />}
                />

                {/* Year of Study */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Year of Study
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <select
                      value={yearOfStudy}
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                    >
                      <option value="">Select current year</option>
                      {YEAR_OPTIONS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Semester
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                    >
                      <option value="">Select current semester</option>
                      {SEMESTER_OPTIONS.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Avatar URL or Upload Helper */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Avatar Photo
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAvatarUrlField((prev) => !prev)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showAvatarUrlField ? 'Hide URL input' : 'Enter Image URL directly'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={uploadingPhoto}
                      leftIcon={<Upload className="w-4 h-4" />}
                    >
                      Upload New Photo (Storage)
                    </Button>
                    <span className="text-[11px] text-slate-400">
                      Max file size: 2MB (JPG, PNG, WebP)
                    </span>
                  </div>

                  {showAvatarUrlField && (
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      leftIcon={<LinkIcon className="w-4 h-4" />}
                      helperText="Direct public image URL to be saved in public.profiles.avatar_url"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEditing}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={saving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving profile...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          ) : (
            /* View Details */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" />
                    <span>Student Name</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.name || 'Not provided'}
                  </p>
                </div>

                {/* Email */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Mail className="w-3.5 h-3.5" />
                    <span>University Email</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {displayEmail || 'Not provided'}
                  </p>
                </div>

                {/* College Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Building className="w-3.5 h-3.5" />
                    <span>College / Institution</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.college_name || (
                      <span className="text-slate-400 dark:text-slate-500 text-sm italic font-normal">
                        No college added yet
                      </span>
                    )}
                  </p>
                </div>

                {/* Year of Study */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Year of Study</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.year_of_study || (
                      <span className="text-slate-400 dark:text-slate-500 text-sm italic font-normal">
                        Not specified
                      </span>
                    )}
                  </p>
                </div>

                {/* Semester */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Current Semester</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.semester || (
                      <span className="text-slate-400 dark:text-slate-500 text-sm italic font-normal">
                        Not specified
                      </span>
                    )}
                  </p>
                </div>

                {/* Account Security & UID */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>User Identifier</span>
                  </div>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                    {user?.id}
                  </p>
                </div>
              </div>

              {/* RLS Security Assurance Note */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Row Level Security (RLS) Active
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Your profile data in <code className="font-mono text-indigo-600 dark:text-indigo-400">public.profiles</code> is strictly protected. Only your authenticated user account can view or update these records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
