import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { GeminiChatbot } from './components/ai/GeminiChatbot';
import { DashboardPage } from './pages/DashboardPage';
import { QuizzesPage } from './pages/QuizzesPage';
import { QuizEditorPage } from './pages/QuizEditorPage';
import { SoloStudyPage } from './pages/SoloStudyPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { HostGamePage } from './pages/HostGamePage';
import { PlayerGamePage } from './pages/PlayerGamePage';
import { MiniGamesPage } from './pages/MiniGamesPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz-tech-01');
  const [initialPin, setInitialPin] = useState<string>('');
  const [isAIChatOpen, setIsAIChatOpen] = useState<boolean>(false);

  const handleNavigate = (tab: string, extra?: string) => {
    if (tab === 'study' || tab === 'flashcards' || tab === 'host' || tab === 'edit-quiz') {
      if (extra) setSelectedQuizId(extra);
    }
    if (tab === 'multiplayer' && extra) {
      setInitialPin(extra);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAIChat={() => {
          if (!currentUser) {
            setCurrentTab('login');
          } else {
            setIsAIChatOpen(true);
          }
        }}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'login' && (
          <LoginPage onSuccess={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            openAIChat={() => {
              if (!currentUser) {
                setCurrentTab('login');
              } else {
                setIsAIChatOpen(true);
              }
            }}
          />
        )}

        {currentTab === 'quizzes' && (
          <QuizzesPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'create-quiz' && (
          <QuizEditorPage
            onBack={() => setCurrentTab('quizzes')}
            onSaved={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'edit-quiz' && (
          <QuizEditorPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
            onSaved={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'study' && (
          <SoloStudyPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'flashcards' && (
          <FlashcardsPage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'host' && (
          <HostGamePage
            quizId={selectedQuizId}
            onBack={() => setCurrentTab('quizzes')}
          />
        )}

        {currentTab === 'multiplayer' && (
          <PlayerGamePage
            initialPin={initialPin}
            onBack={() => setCurrentTab('dashboard')}
            onHostQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              setCurrentTab('host');
            }}
          />
        )}

        {currentTab === 'minigames' && (
          <MiniGamesPage />
        )}

        {currentTab === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Floating Gemini AI Tutor Widget Toggle */}
      {!isAIChatOpen && (
        <button
          onClick={() => {
            if (!currentUser) {
              setCurrentTab('login');
            } else {
              setIsAIChatOpen(true);
            }
          }}
          className="fixed bottom-5 right-5 z-40 p-3.5 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="hidden sm:inline">Hỏi Trợ Giảng AI</span>
        </button>
      )}

      {/* Floating Gemini Chatbot Dialog */}
      <GeminiChatbot
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onRequireLogin={() => {
          setIsAIChatOpen(false);
          setCurrentTab('login');
        }}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} STUDENT STUDY — Nền tảng học tập & ôn luyện kiến thức thế hệ mới.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Được hỗ trợ bởi Google Gemini AI</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Chính sách bảo mật RBAC kích hoạt</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
