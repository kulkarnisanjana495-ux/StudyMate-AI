import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  KeyRound,
  LogOut,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, uploadAvatar } from '../services/profile/profileService';
import { updatePassword } from '../services/auth/authService';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { BackButton } from '../components/BackButton';
import { CollegeSelector } from '../components/CollegeSelector';
import { findCollegeByName } from '../services/college/collegeService';
import {
  YEAR_OPTIONS,
  getSemestersForYear,
  isSemesterValidForYear,
  normalizeSemester,
} from '../constants/academic';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordModalFeedback, setPasswordModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // College details for display mode
  const profileCollegeDetails = profile?.college_name ? findCollegeByName(profile.college_name) : null;

  // Form State
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showAvatarUrlField, setShowAvatarUrlField] = useState(false);

  // Initialize fields from profile or user
  useEffect(() => {
    if (profile) {
      setName(profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '');
      setCollegeName(profile.college_name || '');
      setCollegeId(profile.college_id || null);
      const currentYear = profile.year_of_study || '';
      setYearOfStudy(currentYear);

      const normSem = normalizeSemester(profile.semester);
      if (currentYear) {
        if (isSemesterValidForYear(currentYear, normSem)) {
          setSemester(normSem);
        } else {
          setSemester('');
        }
      } else {
        setSemester(normSem);
      }

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

  /**
   * Dynamically update Year and reset Semester if no longer valid.
   * Example: 1st Year (2nd Semester) -> 2nd Year -> semester resets to empty.
   */
  const handleYearChange = (newYear: string) => {
    setYearOfStudy(newYear);
    const validSemesters = getSemestersForYear(newYear);
    if (!validSemesters.includes(semester)) {
      setSemester('');
    }
  };

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
      setCollegeId(profile.college_id || null);
      const currentYear = profile.year_of_study || '';
      setYearOfStudy(currentYear);

      const normSem = normalizeSemester(profile.semester);
      if (currentYear) {
        if (isSemesterValidForYear(currentYear, normSem)) {
          setSemester(normSem);
        } else {
          setSemester('');
        }
      } else {
        setSemester(normSem);
      }

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
        college_id: collegeId || undefined,
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
    if (!file) return;

    if (!user) {
      setFeedback({
        type: 'error',
        message: 'Please sign in before uploading a profile photo.',
      });
      return;
    }

    // Client-side quick validation: only JPG, JPEG, PNG, WEBP and <= 5 MB
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      setFeedback({
        type: 'error',
        message: 'Unsupported image format. Allowed formats are JPG, JPEG, PNG, and WEBP.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'Profile photo file size exceeds 5 MB. Please select a smaller image.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingPhoto(true);
      setFeedback(null);
      const newUrl = await uploadAvatar(file, user.id);
      setAvatarUrlInput(newUrl);
      await refreshProfile();
      setFeedback({
        type: 'success',
        message: 'Profile photo uploaded and updated successfully!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setFeedback({
        type: 'error',
        message: msg,
      });
      setShowAvatarUrlField(true);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordModalFeedback({
        type: 'error',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordModalFeedback({
        type: 'error',
        message: 'Passwords do not match.',
      });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordModalFeedback(null);
      await updatePassword(newPassword);
      setFeedback({
        type: 'success',
        message: 'Password updated successfully!',
      });
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setPasswordModalFeedback({ type: 'error', message: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';
  const displayEmail = profile?.email || user?.email || '';
  const isEmailVerified = Boolean(user?.email_confirmed_at);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation Button */}
      <div className="flex items-center justify-start">
        {isEditing ? (
          <BackButton
            label="Back to Profile"
            onClick={handleCancelEditing}
            fallback="/profile"
          />
        ) : (
          <BackButton
            fallback="/dashboard"
            label="Back to Dashboard"
          />
        )}
      </div>

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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEditing}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPasswordModalFeedback(null);
                setNewPassword('');
                setConfirmNewPassword('');
                setIsPasswordModalOpen(true);
              }}
              leftIcon={<KeyRound className="w-4 h-4 text-indigo-500" />}
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
            >
              Logout
            </Button>
          </div>
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
                avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || avatarUrlInput}
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
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
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
                  label="Email Address (Read-Only)"
                  value={displayEmail}
                  disabled
                  leftIcon={<Mail className="w-4 h-4" />}
                  helperText="Registered email address is managed via Supabase Auth."
                />

                {/* College Name - Searchable Engineering College Selector */}
                <div className="md:col-span-2">
                  <CollegeSelector
                    label="College Name"
                    required
                    value={collegeName}
                    collegeId={collegeId}
                    onChange={(selectedName, selectedId) => {
                      setCollegeName(selectedName);
                      setCollegeId(selectedId || null);
                    }}
                    helperText="Select your engineering institution from the official AISHE directory. You can search by college name, abbreviation (e.g., BEC, RV), city (e.g., Bengaluru, Belgaum), or state."
                  />
                </div>

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
                      id="year-of-study-select"
                      value={yearOfStudy}
                      onChange={(e) => handleYearChange(e.target.value)}
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

                {/* Semester (Dynamically depends on selected Year of Study) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Semester
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <select
                      id="semester-select"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      disabled={!yearOfStudy}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {yearOfStudy ? 'Select current semester' : 'Select year of study first'}
                      </option>
                      {getSemestersForYear(yearOfStudy).map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!yearOfStudy && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Select your Year of Study to see available semesters.
                    </p>
                  )}
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
                      Max file size: 5 MB (JPG, PNG, WEBP)
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
                    <span>Email Address</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {displayEmail || 'Not provided'}
                  </p>
                </div>

                {/* College Name */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <Building className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                      <span>College / Institution</span>
                    </div>
                    {profileCollegeDetails?.aishe_code && (
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                        AISHE: {profileCollegeDetails.aishe_code}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {profile?.college_name || (
                      <span className="text-slate-400 dark:text-slate-500 text-sm italic font-normal">
                        No college added yet
                      </span>
                    )}
                  </p>
                  {profileCollegeDetails && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                      <span>{profileCollegeDetails.city}, {profileCollegeDetails.state}</span>
                      <span>•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{profileCollegeDetails.college_type}</span>
                    </div>
                  )}
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

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        description="Update your StudyMate account password securely via Supabase Auth."
      >
        <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
          {passwordModalFeedback && (
            <Alert
              variant={passwordModalFeedback.type}
              onDismiss={() => setPasswordModalFeedback(null)}
            >
              {passwordModalFeedback.message}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmNewPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={savingPassword}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
