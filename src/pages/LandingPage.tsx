import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileText,
  Award,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const coreModules = [
    {
      icon: FileText,
      title: 'AI PDF Learning',
      description: 'Upload textbooks, lecture slides, and professor handouts for contextual deep dives.',
    },
    {
      icon: BookOpen,
      title: 'AI Academic Tutor',
      description: 'Step-by-step concept explanations tailored to university syllabi and engineering/degree standards.',
    },
    {
      icon: HelpCircle,
      title: 'Question Generator',
      description: 'Generate 2-mark, 5-mark, and 10-mark college exam questions with comprehensive solutions.',
    },
    {
      icon: Award,
      title: 'Quiz & Mock Tests',
      description: 'Topic-wise timed assessments with university grading criteria and feedback.',
    },
    {
      icon: Layers,
      title: 'Previous-Year Analyzer',
      description: 'Analyze recurring exam trends, high-frequency topics, and semester weightage.',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Student Profiles',
      description: 'College, year of study, and semester-specific customization for your academic journey.',
    },
  ];

  return (
    <div className="space-y-16 py-6 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Tailored for University & College Students</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
          Study Smarter.{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
            Prepare Better.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An AI-powered academic learning and college exam preparation platform built for university students.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {user ? (
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to Your Dashboard
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Architected for Higher Education Success
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything undergraduate and postgraduate students need to master subjects and pass university exams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreModules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* College Readiness Architecture */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
            <span>University Focus</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Designed for Semester Syllabi and Exam Patterns
          </h2>

          <p className="text-sm sm:text-base text-indigo-200/90 leading-relaxed">
            From Engineering and Computer Science to Commerce and Sciences, StudyMate AI structures learning around your actual university subjects, semesters, and internal tests.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-indigo-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Semester & College profile mapping</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Secure authenticated student access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Standard 2-mark to 10-mark exam formats</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Seamless Google & GitHub integrations</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              size="lg"
              className="bg-white text-indigo-950 hover:bg-indigo-50 shadow-none border-none font-bold"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              {user ? 'Enter Dashboard' : 'Join Your College Cohort'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
