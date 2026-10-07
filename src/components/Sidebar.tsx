import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bot,
  HelpCircle,
  Award,
  BookOpenCheck,
  CalendarCheck,
  Zap,
  FileSearch,
  Briefcase,
  TrendingUp,
  GraduationCap,
  LogOut,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileAvatar } from './ProfileAvatar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: string;
  disabled?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navSections: NavSection[] = [
    {
      items: [
        {
          name: 'Dashboard',
          icon: LayoutDashboard,
          path: '/dashboard',
        },
      ],
    },
    {
      title: 'ACADEMIC LEARNING',
      items: [
        { name: 'AI PDF Learning', icon: FileText, path: '/modules/pdf-learning' },
        { name: 'AI Tutor', icon: Bot, path: '/modules/ai-tutor' },
        { name: 'Question Generator', icon: HelpCircle, path: '/modules/question-generator' },
        { name: 'Quiz & Mock Test', icon: Award, path: '/modules/quiz' },
      ],
    },
    {
      title: 'EXAM PREPARATION',
      items: [
        { name: 'Exam Preparation', icon: BookOpenCheck, path: '/modules/exam-prep' },
        { name: 'Study Planner', icon: CalendarCheck, path: '/modules/study-planner' },
        { name: 'Last-Minute Revision', icon: Zap, path: '/modules/revision' },
        { name: 'Previous-Year Analyzer', icon: FileSearch, path: '/modules/pyq-analyzer' },
      ],
    },
    {
      title: 'PLACEMENT & CAREER',
      items: [
        { name: 'Aptitude Practice', icon: Briefcase, path: '/modules/aptitude' },
      ],
    },
    {
      title: 'PERFORMANCE',
      items: [
        { name: 'Progress & Analytics', icon: TrendingUp, path: '/modules/analytics' },
      ],
    },
  ];

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';
  const displayCollege = profile?.college_name || 'University Student';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div
            onClick={() => {
              navigate(user ? '/dashboard' : '/');
              onClose();
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                StudyMate AI
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                University Prep
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.disabled || !item.path) {
                  return (
                    <div
                      key={item.name}
                      className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 select-none cursor-default transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Quick Profile Nav Link */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 pb-1 text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              ACCOUNT
            </div>
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 shrink-0" />
                <span>Student Profile</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* User Card at Bottom */}
        {user && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3 p-1.5 rounded-xl">
              <ProfileAvatar
                name={displayName}
                avatarUrl={profile?.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {displayCollege}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
