import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

interface ModuleDetails {
  id: string;
  title: string;
  tagline: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  overview: string;
  keyFeatures: string[];
  sampleActions: string[];
}

const MODULE_REGISTRY: Record<string, ModuleDetails> = {
  'pdf-learning': {
    id: 'pdf-learning',
    title: 'AI PDF Learning',
    tagline: 'Interactive concept breakdown from syllabus & textbooks',
    category: 'Academic Core',
    icon: FileText,
    overview:
      'Upload lecture notes, university textbooks, and syllabus outlines. StudyMate AI parses chapter diagrams, extracts core theorems, and converts dense pages into bite-sized concept summaries.',
    keyFeatures: [
      'Multi-chapter PDF semantic indexing & vector retrieval',
      'Formula & diagram contextual explanation',
      'Instant margin notes & automated executive summaries',
      'Direct citations mapped back to textbook page numbers',
    ],
    sampleActions: ['Upload Chapter PDF', 'Ask question from document', 'Generate 1-page summary'],
  },
  'ai-tutor': {
    id: 'ai-tutor',
    title: 'AI Tutor',
    tagline: 'Conversational academic mentor aligned with your curriculum',
    category: 'Academic Core',
    icon: Bot,
    overview:
      'A dedicated 24/7 academic tutor customized for your college branch and current semester. Explains complex algorithms, derivations, and theoretical proofs with step-by-step guidance.',
    keyFeatures: [
      'Socratic dialogue teaching style for deep understanding',
      'Mathematical LaTeX rendering & code snippet execution',
      'Branch-specific terminology (CS, Mech, EC, Civil, EE, Medical, Law)',
      'Adaptive pacing based on your verified grasp of prerequisites',
    ],
    sampleActions: ['Start chat session', 'Explain difficult theorem', 'Debug code implementation'],
  },
  'question-generator': {
    id: 'question-generator',
    title: 'AI Question Generator',
    tagline: 'University-standard exam questions with model answers',
    category: 'Exam Prep',
    icon: HelpCircle,
    overview:
      'Simulate authentic semester question papers. Generates Bloom-taxonomy-aligned 2-mark definitions, 5-mark short answers, and 10-mark essay/derivation questions matching your syllabus.',
    keyFeatures: [
      'Configurable mark weightage (2, 5, 8, 10, 16 marks)',
      'Full model answer schemes with step marking rubrics',
      'Bloom’s taxonomy filters (Remember, Understand, Apply, Analyze)',
      'Exportable to formatted PDF for offline practice',
    ],
    sampleActions: ['Generate 10-mark questions', 'Create unit test paper', 'View evaluation rubric'],
  },
  quiz: {
    id: 'quiz',
    title: 'Quiz',
    tagline: 'Topic-wise rapid fire quizzes with instant feedback',
    category: 'Testing',
    icon: Award,
    overview:
      'Short diagnostic tests designed to reinforce memory retention through active recall and spaced repetition. Identifies knowledge gaps before college mid-terms.',
    keyFeatures: [
      'Topic-level concept checks (10-15 questions)',
      'Immediate explanations for correct & incorrect options',
      'Streak multipliers and accuracy tracking',
      'Spaced repetition reminders for weak areas',
    ],
    sampleActions: ['Start 10-min quiz', 'Practice weak topics', 'View topic accuracy'],
  },
  'mock-test': {
    id: 'mock-test',
    title: 'Mock Test',
    tagline: 'Full-length timed semester examination simulation',
    category: 'Testing',
    icon: Award,
    overview:
      'Strictly timed exam simulations recreating college exam hall conditions. Features negative marking options, section timers, and AI auto-grading with detailed scorecards.',
    keyFeatures: [
      '3-hour & 90-minute timed exam presets',
      'Sectional switching and question flagging',
      'AI-assisted rubric grading on descriptive questions',
      'Percentile benchmarking against university cohorts',
    ],
    sampleActions: ['Launch timed mock test', 'Review previous scorecards', 'Analyze time per question'],
  },
  'exam-prep': {
    id: 'exam-prep',
    title: 'Exam Preparation',
    tagline: 'Comprehensive chapter revisions & formula cheat sheets',
    category: 'Readiness',
    icon: BookOpenCheck,
    overview:
      'A structured readiness cockpit designed for the 2 weeks leading up to finals. Curates essential definitions, high-frequency derivations, and critical diagrams.',
    keyFeatures: [
      'High-weightage topic heatmaps based on past trends',
      'Formula sheets & key theorem flashcards',
      'Must-solve problem sets per subject module',
      'Checklist tracking of completed syllabus units',
    ],
    sampleActions: ['View high-weightage topics', 'Download formula cheat sheet', 'Track syllabus checklist'],
  },
  'study-planner': {
    id: 'study-planner',
    title: 'Study Planner',
    tagline: 'Dynamic timetable schedules synchronized with exam dates',
    category: 'Organization',
    icon: CalendarCheck,
    overview:
      'AI-generated study schedules that adapt to your remaining days before university exams. Automatically balances difficult subjects with revision breaks.',
    keyFeatures: [
      'Exam date countdown & daily study targets',
      'Dynamic rescheduling if you fall behind on a day',
      'Pomodoro interval optimization for high focus',
      'Calendar export (iCal, Google Calendar integration ready)',
    ],
    sampleActions: ['Set exam date', 'Regenerate weekly plan', 'Mark today’s goals done'],
  },
  revision: {
    id: 'revision',
    title: 'Last-Minute Revision',
    tagline: 'High-speed concept recap for the night before exams',
    category: 'Speed Revision',
    icon: Zap,
    overview:
      'Condensed 5-minute flash recaps for rapid memory triggering before stepping into the exam room. Distills entire 5-unit subjects down to essential points.',
    keyFeatures: [
      'Bullet-point memory anchors for every unit',
      'Common pitfalls and mistakes to avoid in answers',
      'Key definitions in exact university wording',
      'Rapid audio summary mode for on-the-go review',
    ],
    sampleActions: ['Open 5-minute unit recap', 'Review common mistakes', 'Scan key formulas'],
  },
  'pyq-analyzer': {
    id: 'pyq-analyzer',
    title: 'Previous-Year Analyzer',
    tagline: 'Trend analysis of past 5-10 years university question papers',
    category: 'Pattern Analysis',
    icon: FileSearch,
    overview:
      'Identifies the exact questions and topics repeated most frequently across university exam seasons. Prioritize study hours on topics guaranteed to appear.',
    keyFeatures: [
      'Frequency ranking of recurring exam questions',
      'Year-by-year topic distribution bar charts',
      'Paper pattern anomaly detection',
      'Direct links from PYQ to recommended textbook solutions',
    ],
    sampleActions: ['Analyze 5-year paper trends', 'View top 20 repeated questions', 'Filter by university board'],
  },
  aptitude: {
    id: 'aptitude',
    title: 'Aptitude Practice',
    tagline: 'Quantitative, logical reasoning, and verbal aptitude prep',
    category: 'Placement & Career',
    icon: Briefcase,
    overview:
      'Prepare for campus placements and competitive entrance exams. Practice quantitative tricks, data interpretation, logical puzzles, and verbal reasoning.',
    keyFeatures: [
      'Speed math shortcuts and mental calculation drills',
      'Topic coverage: Time & Work, P&C, Probability, Syllogisms',
      'Company-specific test patterns (TCS, Infosys, Wipro, Amazon, etc.)',
      'Detailed solution methods with alternate shortcut approaches',
    ],
    sampleActions: ['Practice Quant questions', 'Solve Logical puzzle', 'Take 20-min placement test'],
  },
  analytics: {
    id: 'analytics',
    title: 'Progress & Analytics',
    tagline: 'Objective performance metrics across all subjects',
    category: 'Insights',
    icon: TrendingUp,
    overview:
      'Comprehensive telemetry on your academic preparation journey. Visualizes learning curve, time spent, quiz scores, and subject mastery levels.',
    keyFeatures: [
      'Subject-wise mastery percentages and weak areas radar',
      'Daily study time consistency graph',
      'Mock test accuracy vs. speed scatter analysis',
      'Readiness index score out of 100 for upcoming finals',
    ],
    sampleActions: ['View weak topics breakdown', 'Check study streak', 'Export readiness report'],
  },
};

export const ModuleFeaturePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const moduleData: ModuleDetails =
    (moduleId && MODULE_REGISTRY[moduleId]) || {
      id: moduleId || 'module',
      title: moduleId
        ? moduleId
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Learning Module',
      tagline: 'AI-assisted university academic preparation tool',
      category: 'Workspace',
      icon: Sparkles,
      overview:
        'This specialized module provides AI-driven learning tools aligned with college exams and university coursework.',
      keyFeatures: [
        'Curriculum-aligned concept learning',
        'Model question generation & evaluation',
        'Personalized student progress tracking',
        'Exam-oriented study synthesis',
      ],
      sampleActions: ['Explore module', 'View study guide', 'Back to dashboard'],
    };

  const Icon = moduleData.icon;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation Bar with Consistent BackButton */}
      <div className="flex items-center justify-between">
        <BackButton fallback="/dashboard" label="Back to Dashboard" />
        <span className="text-xs px-3 py-1 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          {moduleData.category}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
            <Icon className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {moduleData.title}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Phase 1 Preview
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {moduleData.tagline}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            {moduleData.overview}
          </p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Features (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Planned Capabilities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {moduleData.keyFeatures.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{feat}</span>
              </div>
            ))}
          </div>

          {/* Student Context Note */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                Personalized for: <strong>{profile?.name || 'Student'}</strong> (
                {profile?.college_name || 'College Student'}, {profile?.year_of_study || 'Year 1'})
              </span>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer shrink-0 ml-2"
            >
              Edit &rarr;
            </button>
          </div>
        </div>

        {/* Action Panel (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Sprint 2 Integration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This module's UI layout and state management are being extended. You can test back navigation or jump back to other modules anytime.
            </p>

            <div className="space-y-2 pt-2">
              {moduleData.sampleActions.map((action, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between"
                >
                  <span>{action}</span>
                  <span className="text-[10px] text-slate-400 uppercase">Roadmap</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
