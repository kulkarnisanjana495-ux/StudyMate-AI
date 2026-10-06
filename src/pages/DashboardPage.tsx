import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  HelpCircle,
  Bot,
  Award,
  BookOpenCheck,
  CalendarCheck,
  Briefcase,
  TrendingUp,
  User,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface ModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

export const DashboardPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<ModuleCard | null>(null);

  const studentName =
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Student';

  const modules: ModuleCard[] = [
    {
      id: 'pdf-learning',
      title: 'AI PDF Learning',
      description: 'Upload textbooks, lecture notes, and syllabus PDFs for interactive concept breakdown.',
      icon: FileText,
      tag: 'Academic Core',
    },
    {
      id: 'question-gen',
      title: 'AI Question Generator',
      description: 'Generate university-standard 2, 5, and 10 mark exam questions with model answers.',
      icon: HelpCircle,
      tag: 'Exam Prep',
    },
    {
      id: 'ai-tutor',
      title: 'AI Tutor',
      description: 'Conversational academic tutor aligned with college curriculums and engineering branches.',
      icon: Bot,
      tag: 'Interactive',
    },
    {
      id: 'quiz-mock',
      title: 'Quiz & Mock Test',
      description: 'Timed subject assessments with university grading criteria and detailed solutions.',
      icon: Award,
      tag: 'Testing',
    },
    {
      id: 'exam-prep',
      title: 'Exam Preparation',
      description: 'Comprehensive chapter revisions, high-weightage topics, and formula cheat sheets.',
      icon: BookOpenCheck,
      tag: 'Readiness',
    },
    {
      id: 'study-planner',
      title: 'Study Planner',
      description: 'Structured timetable schedules aligned with upcoming semester exams and internal tests.',
      icon: CalendarCheck,
      tag: 'Organization',
    },
    {
      id: 'aptitude',
      title: 'Aptitude Practice',
      description: 'Quantitative, logical reasoning, and verbal aptitude preparation for campus placements.',
      icon: Briefcase,
      tag: 'Placement',
    },
    {
      id: 'analytics',
      title: 'Progress & Analytics',
      description: 'Objective tracking of topics mastered and mock assessment evaluations.',
      icon: TrendingUp,
      tag: 'Insights',
    },
  ];

  const hasIncompleteProfile = !profile?.college_name || !profile?.year_of_study || !profile?.semester;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Welcome back, {studentName} 👋
          </h1>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-indigo-200">
              StudyMate AI
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Your personalized academic learning assistant.
            </p>
          </div>

          {/* Quick Academic Profile Summary */}
          <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-indigo-300 font-medium">College: </span>
              <span className="font-semibold">{profile?.college_name || 'Not set'}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-indigo-300 font-medium">Year: </span>
              <span className="font-semibold">{profile?.year_of_study || 'Not set'}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-indigo-300 font-medium">Semester: </span>
              <span className="font-semibold">{profile?.semester || 'Not set'}</span>
            </div>

            {hasIncompleteProfile && (
              <button
                onClick={() => navigate('/profile?edit=true')}
                className="text-xs font-semibold text-indigo-300 hover:text-white underline ml-1 cursor-pointer"
              >
                Complete Profile &rarr;
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Modules Placeholder Navigation Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Upcoming Learning Modules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any workspace module below to view planned capabilities.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
            Sprint 1 Foundation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-300 transition-colors">
                      Coming soon
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {mod.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <span>{mod.tag}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform text-indigo-500">
                    Preview &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Module Information Modal */}
      {selectedModule && (
        <Modal
          isOpen={Boolean(selectedModule)}
          onClose={() => setSelectedModule(null)}
          title={selectedModule.title}
          description="Module Roadmap Placeholder"
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-semibold">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Under Active Development</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedModule.description}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Phase 1 Status:
              </p>
              <p>
                The authentication, database triggers, security rules, and student profile layers are verified and functional. This module will be wired by the curriculum engineering team in the upcoming sprint.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedModule(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
