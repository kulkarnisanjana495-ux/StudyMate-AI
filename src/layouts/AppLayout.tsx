import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Determine page title based on path
  const getPageTitle = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'Academic Dashboard';
    if (path.startsWith('/profile')) return 'Student Profile';
    if (path.startsWith('/modules/pdf-learning')) return 'AI PDF Learning';
    if (path.startsWith('/modules/ai-tutor')) return 'AI Tutor';
    if (path.startsWith('/modules/question-generator')) return 'AI Question Generator';
    if (path.startsWith('/modules/quiz')) return 'Quiz';
    if (path.startsWith('/modules/mock-test')) return 'Mock Test';
    if (path.startsWith('/modules/exam-prep')) return 'Exam Preparation';
    if (path.startsWith('/modules/study-planner')) return 'Study Planner';
    if (path.startsWith('/modules/revision')) return 'Last-Minute Revision';
    if (path.startsWith('/modules/pyq-analyzer')) return 'Previous-Year Analyzer';
    if (path.startsWith('/modules/aptitude')) return 'Aptitude Practice';
    if (path.startsWith('/modules/analytics')) return 'Progress & Analytics';
    if (path.startsWith('/modules')) return 'Learning Workspace';
    if (path.startsWith('/auth/callback')) return 'Account Verification';
    if (path.startsWith('/auth/verify-email') || path.startsWith('/verify-email')) return 'Email Verification';
    if (path.startsWith('/forgot-password')) return 'Password Recovery';
    if (path.startsWith('/reset-password')) return 'Reset Password';
    return 'StudyMate AI';
  };

  const showSidebar = Boolean(
    user && (
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/modules')
    )
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <div className="flex flex-1 min-h-0">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <div className={`flex-1 flex flex-col min-w-0 ${showSidebar ? 'lg:pl-64' : ''}`}>
          <Navbar
            onToggleSidebar={showSidebar ? () => setSidebarOpen((prev) => !prev) : undefined}
            pageTitle={getPageTitle(location.pathname)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
