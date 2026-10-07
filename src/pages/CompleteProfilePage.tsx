import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Layers,
  Lock,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  Sparkles,
  LogOut,
  Upload,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, uploadAvatar } from '../services/profile/profileService';
import { updatePassword } from '../services/auth/authService';
import { isProfileComplete } from '../types/profile';
import {
  YEAR_OPTIONS,
  getSemestersForYear,
  isSemesterValidForYear,
  normalizeSemester,
} from '../constants/academic';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export const CompleteProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [semester, setSemester] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // If already profile-complete, send to dashboard
  useEffect(() => {
    if (profile && isProfileComplete(profile)) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, navigate]);

  // Pre-populate fields from authenticated user and profile
  useEffect(() => {
    if (user) {
      const initialEmail = user.email || '';
      setEmail(initialEmail);

      const oauthName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.user_name ||
        (initialEmail ? initialEmail.split('@')[0] : '');

      setName(profile?.name || oauthName);
      setCollegeName(profile?.college_name || '');

      const currentYear = profile?.year_of_study || '';
      setYearOfStudy(currentYear);
      const normSem = normalizeSemester(profile?.semester);
      if (currentYear && isSemesterValidForYear(currentYear, normSem)) {
        setSemester(normSem);
      } else {
        setSemester('');
      }

      // Avatar priority: student-uploaded avatar, then OAuth avatar
      const initialAvatar =
        profile?.avatar_url ||
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;
      setAvatarPreview(initialAvatar);
    }
  }, [user, profile]);

  const provider = user?.app_metadata?.provider || 'oauth';
  const isGoogle = provider === 'google';
  const isGithub = provider === 'github';

  const handleYearChange = (newYear: string) => {
    setYearOfStudy(newYear);
    const validSemesters = getSemestersForYear(newYear);
    if (!validSemesters.includes(semester)) {
      setSemester('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setFeedback({ type: 'error', message: 'Please sign in before uploading a profile photo.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Only image files are accepted. Please select a JPG, PNG, or WEBP file.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      setFeedback({ type: 'error', message: 'Unsupported format. Allowed formats: JPG, JPEG, PNG, and WEBP.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Profile photo file size exceeds 5 MB. Please select a smaller image.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadingPhoto(true);
      setFeedback(null);
      const displayUrl = await uploadAvatar(file, user.id);
      setAvatarPreview(displayUrl);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Profile photo uploaded successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }
    if (!collegeName.trim()) {
      setFeedback({ type: 'error', message: 'College name is required.' });
      return;
    }
    if (!yearOfStudy.trim()) {
      setFeedback({ type: 'error', message: 'Please select your Year of Study.' });
      return;
    }
    if (!semester.trim()) {
      setFeedback({ type: 'error', message: 'Please select your Semester.' });
      return;
    }

    // Password validation: required for StudyMate account sign-in
    if (!password) {
      setFeedback({
        type: 'error',
        message: 'Please create a password for your StudyMate account.',
      });
      return;
    }

    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Passwords do not match. Please verify both password fields.',
      });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      // 1. Securely set StudyMate password via Supabase Auth
      await updatePassword(password);

      // 2. Save profile fields to public.profiles (never contains password)
      await updateProfile(user.id, {
        name: name.trim(),
        college_name: collegeName.trim(),
        year_of_study: yearOfStudy,
        semester: semester,
      });

      await refreshProfile();

      setFeedback({
        type: 'success',
        message: 'Profile completed successfully! Welcome to StudyMate AI.',
      });

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete profile.';
      setFeedback({ type: 'error', message: msg });
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto py-4 sm:py-8 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-md overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-indigo-200 text-xs font-semibold border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Time Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Complete your StudyMate profile
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Just a few details before you get started.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* OAuth Account Badge */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
            {isGoogle && (
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            {isGithub && (
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            )}
            <span className="font-semibold text-white">
              {isGoogle ? 'Signed in with Google' : isGithub ? 'Signed in with GitHub' : 'Authenticated'}
            </span>
          </div>
          <span className="text-indigo-200 text-xs">
            {email}
          </span>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Main Setup Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <ProfileAvatar
                name={name || user?.email}
                avatarUrl={avatarPreview}
                size="xl"
                className="border-4 border-indigo-100 dark:border-indigo-900/40 shadow-md"
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

            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Profile Photo (Optional)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {avatarPreview
                  ? 'Your profile photo is set. You can upload a new photo anytime.'
                  : 'We can use your account picture or upload a custom photo.'}
              </p>
              <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploadingPhoto}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Photo
                </Button>
                <span className="text-[11px] text-slate-400">Max 5 MB (JPG, PNG, WEBP)</span>
              </div>
            </div>
          </div>

          {/* Academic Details Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Academic Credentials</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              {/* Email (Read-Only) */}
              <Input
                label="Email Address (Authenticated Identity)"
                value={email}
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
                helperText="Populated automatically from your verified account."
              />

              {/* College Name */}
              <Input
                label="College / University Name *"
                placeholder="e.g. National Institute of Engineering"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
                required
              />

              {/* Year of Study */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Year of Study *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    id="complete-profile-year"
                    value={yearOfStudy}
                    onChange={(e) => handleYearChange(e.target.value)}
                    required
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

              {/* Semester (Dynamically depends on Year of Study) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semester *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    id="complete-profile-semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    disabled={!yearOfStudy}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Please select Year of Study first.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Create StudyMate Password Section */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Create a StudyMate Password</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Set a StudyMate password so you can also sign in using your email address anytime.
                (This belongs to your StudyMate account and is managed securely via Supabase Auth).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={saving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {saving ? 'Completing profile...' : 'Save & Continue to Dashboard'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
