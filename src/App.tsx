import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { ModuleFeaturePage } from './pages/ModuleFeaturePage';

// Route listener to automatically route password recovery tokens
function AuthEventListener() {
  const { passwordRecoveryActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If user clicked a recovery link from email
    if (
      passwordRecoveryActive ||
      window.location.hash.includes('type=recovery') ||
      location.hash.includes('type=recovery')
    ) {
      if (location.pathname !== '/reset-password') {
        navigate('/reset-password');
      }
    }
  }, [passwordRecoveryActive, navigate, location]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthEventListener />
          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected Routes */}
              <Route
                path="/complete-profile"
                element={
                  <ProtectedRoute allowIncomplete>
                    <CompleteProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowIncomplete>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modules/:moduleId"
                element={
                  <ProtectedRoute>
                    <ModuleFeaturePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pdf-learning"
                element={<Navigate to="/modules/pdf-learning" replace />}
              />
              <Route
                path="/ai-tutor"
                element={<Navigate to="/modules/ai-tutor" replace />}
              />
              <Route
                path="/question-generator"
                element={<Navigate to="/modules/question-generator" replace />}
              />
              <Route
                path="/quiz"
                element={<Navigate to="/modules/quiz" replace />}
              />
              <Route
                path="/mock-test"
                element={<Navigate to="/modules/mock-test" replace />}
              />
              <Route
                path="/exam-prep"
                element={<Navigate to="/modules/exam-prep" replace />}
              />
              <Route
                path="/study-planner"
                element={<Navigate to="/modules/study-planner" replace />}
              />
              <Route
                path="/revision"
                element={<Navigate to="/modules/revision" replace />}
              />
              <Route
                path="/pyq-analyzer"
                element={<Navigate to="/modules/pyq-analyzer" replace />}
              />
              <Route
                path="/aptitude"
                element={<Navigate to="/modules/aptitude" replace />}
              />
              <Route
                path="/analytics"
                element={<Navigate to="/modules/analytics" replace />}
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
